from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db import get_db
from app.models import (
    User,
    FarmerProfile,
    Crop,
    CropHistory,
    Diagnosis,
    ChatMessage,
)
from app.schemas import *
from app.security import hash_pw, verify_pw, token
from app.deps import current_user

from app.services.recommend import fertilizer, irrigation
from app.services.weather import weather
from app.services.chat import answer

from app.ai.disease import predict


s = settings()

Path(s.upload_dir).mkdir(
    parents=True,
    exist_ok=True,
)


app = FastAPI(
    title="Smart AI Farming Assistant",
    version="1.0.0",
    description="AI-powered agricultural decision-support platform",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=s.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


# =========================================================
# AUTH
# =========================================================

@app.post(
    "/api/auth/register",
    response_model=Token,
    status_code=201,
)
def register(
    x: Register,
    db: Session = Depends(get_db),
):
    if db.scalar(
        select(User).where(
            User.email == x.email.lower()
        )
    ):
        raise HTTPException(
            409,
            "Email already registered",
        )

    u = User(
        email=x.email.lower(),
        password_hash=hash_pw(x.password),
    )

    p = FarmerProfile(
        full_name=x.full_name,
        phone=x.phone,
        city=x.city,
        state=x.state,
        farm_size_acres=x.farm_size_acres,
        soil_type=x.soil_type,
    )

    u.profile = p

    db.add(u)
    db.commit()
    db.refresh(u)

    return {
        "access_token": token(u.id),
        "token_type": "bearer",
    }


@app.post(
    "/api/auth/login",
    response_model=Token,
)
def login(
    f: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    u = db.scalar(
        select(User).where(
            User.email == f.username.lower()
        )
    )

    if not u or not verify_pw(
        f.password,
        u.password_hash,
    ):
        raise HTTPException(
            401,
            "Incorrect email or password",
        )

    return {
        "access_token": token(u.id),
        "token_type": "bearer",
    }


@app.get("/api/auth/me")
def me(
    u: User = Depends(current_user),
):
    return {
        "id": u.id,
        "email": u.email,
        "role": u.role,
        "profile": (
            ProfileOut.model_validate(u.profile)
            if u.profile
            else None
        ),
    }


# =========================================================
# PROFILE
# =========================================================

@app.get(
    "/api/profile",
    response_model=ProfileOut,
)
def profile(
    u: User = Depends(current_user),
):
    return u.profile


@app.put(
    "/api/profile",
    response_model=ProfileOut,
)
def update_profile(
    x: ProfileIn,
    u: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    for k, v in x.model_dump().items():
        setattr(u.profile, k, v)

    db.commit()
    db.refresh(u.profile)

    return u.profile


# =========================================================
# CROP MANAGEMENT
# =========================================================

@app.get(
    "/api/crops",
    response_model=list[CropOut],
)
def crops(
    u: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    return list(
        db.scalars(
            select(Crop)
            .where(Crop.user_id == u.id)
            .order_by(Crop.created_at.desc())
        )
    )


def owned(
    cid,
    u,
    db,
):
    c = db.scalar(
        select(Crop).where(
            Crop.id == cid,
            Crop.user_id == u.id,
        )
    )

    if not c:
        raise HTTPException(
            404,
            "Crop not found",
        )

    return c


@app.post(
    "/api/crops",
    response_model=CropOut,
    status_code=201,
)
def add_crop(
    x: CropIn,
    u: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    c = Crop(
        user_id=u.id,
        **x.model_dump(),
    )

    db.add(c)
    db.flush()

    db.add(
        CropHistory(
            crop_id=c.id,
            event_type="created",
            description="Crop record created",
        )
    )

    db.commit()
    db.refresh(c)

    return c


@app.put(
    "/api/crops/{cid}",
    response_model=CropOut,
)
def edit_crop(
    cid: int,
    x: CropIn,
    u: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    c = owned(cid, u, db)

    for k, v in x.model_dump().items():
        setattr(c, k, v)

    db.add(
        CropHistory(
            crop_id=c.id,
            event_type="updated",
            description="Crop record updated",
        )
    )

    db.commit()
    db.refresh(c)

    return c


@app.delete(
    "/api/crops/{cid}",
    status_code=204,
)
def del_crop(
    cid: int,
    u: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    db.delete(
        owned(cid, u, db)
    )

    db.commit()


@app.get(
    "/api/crops/{cid}/history",
    response_model=list[HistoryOut],
)
def hist(
    cid: int,
    u: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    return list(
        db.scalars(
            select(CropHistory)
            .where(
                CropHistory.crop_id
                == owned(cid, u, db).id
            )
            .order_by(
                CropHistory.recorded_at.desc()
            )
        )
    )


@app.post(
    "/api/crops/{cid}/history",
    response_model=HistoryOut,
    status_code=201,
)
def add_hist(
    cid: int,
    x: HistoryIn,
    u: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    e = CropHistory(
        crop_id=owned(cid, u, db).id,
        **x.model_dump(),
    )

    db.add(e)
    db.commit()
    db.refresh(e)

    return e


# =========================================================
# DASHBOARD
# =========================================================

@app.get("/api/dashboard")
def dashboard(
    u: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    total = (
        db.scalar(
            select(func.count(Crop.id))
            .where(Crop.user_id == u.id)
        )
        or 0
    )

    active = (
        db.scalar(
            select(func.count(Crop.id))
            .where(
                Crop.user_id == u.id,
                Crop.status == "active",
            )
        )
        or 0
    )

    diags = (
        db.scalar(
            select(func.count(Diagnosis.id))
            .where(
                Diagnosis.user_id == u.id
            )
        )
        or 0
    )

    return {
        "active_crops": active,
        "total_crops": total,
        "diagnoses": diags,
        "recent_crops": list(
            db.scalars(
                select(Crop)
                .where(
                    Crop.user_id == u.id
                )
                .order_by(
                    Crop.created_at.desc()
                )
                .limit(5)
            )
        ),
    }


# =========================================================
# DISEASE INFORMATION
# =========================================================

DISEASE_INFO = {

    "healthy": {
        "symptoms": "No major disease symptoms detected. The leaf appears generally healthy.",
        "treatment": "No disease treatment is required. Continue normal crop care, balanced nutrition and appropriate irrigation.",
        "prevention": "Keep the field clean, monitor leaves regularly and maintain good air circulation around plants.",
    },

    "apple_scab": {
        "symptoms": "Olive-green to dark spots may appear on leaves and can become darker or develop a velvety appearance.",
        "treatment": "Remove heavily affected fallen leaves and prune for better air circulation. Follow locally approved disease-management guidance if symptoms continue.",
        "prevention": "Maintain orchard sanitation, remove infected plant debris and avoid prolonged leaf wetness.",
    },

    "apple_black_rot": {
        "symptoms": "Dark brown or black leaf spots and dead tissue may develop. Fruit and branches can also be affected.",
        "treatment": "Remove affected plant material and maintain orchard sanitation. Use locally approved disease-control products only according to their label.",
        "prevention": "Remove dead wood and infected debris and maintain good orchard airflow.",
    },

    "apple_cedar_apple_rust": {
        "symptoms": "Yellow to orange spots can develop on apple leaves, sometimes with darker structures on the underside.",
        "treatment": "Remove severely affected leaves where practical and follow local orchard disease-management recommendations.",
        "prevention": "Monitor plants during humid periods and manage nearby alternate hosts where appropriate.",
    },

    "blueberry_healthy": {
        "symptoms": "No major disease symptoms detected.",
        "treatment": "No disease treatment is required. Continue normal blueberry crop care.",
        "prevention": "Maintain proper irrigation, nutrition, sanitation and airflow.",
    },

    "cherry_powdery_mildew": {
        "symptoms": "White powdery growth may appear on leaves and young shoots, with distorted or weakened new growth.",
        "treatment": "Remove severely affected material where practical and improve airflow. Follow locally approved powdery-mildew management guidance.",
        "prevention": "Avoid excessive nitrogen, improve plant spacing and maintain good airflow.",
    },

    "corn_common_rust": {
        "symptoms": "Small reddish-brown rust-colored pustules may appear on corn leaves.",
        "treatment": "Monitor disease development and use locally recommended resistant varieties and disease-management practices.",
        "prevention": "Use resistant varieties where available and maintain balanced crop nutrition.",
    },

    "corn_gray_leaf_spot": {
        "symptoms": "Long rectangular gray to tan lesions may develop between leaf veins.",
        "treatment": "Remove or manage infected crop residue and follow local disease-management recommendations.",
        "prevention": "Use resistant varieties, rotate crops where appropriate and manage crop residue.",
    },

    "corn_northern_leaf_blight": {
        "symptoms": "Long gray-green or tan cigar-shaped lesions can appear on corn leaves.",
        "treatment": "Monitor disease spread and follow locally approved management practices.",
        "prevention": "Use resistant varieties, crop rotation and good residue management.",
    },

    "corn_healthy": {
        "symptoms": "No major disease symptoms detected.",
        "treatment": "No disease treatment is required. Continue normal crop management.",
        "prevention": "Maintain balanced nutrition, appropriate irrigation and regular crop monitoring.",
    },

    "grape_black_rot": {
        "symptoms": "Brown or reddish leaf spots can develop and may contain darker centers. Fruit can also become affected.",
        "treatment": "Remove infected fruit and plant debris and improve canopy airflow. Follow locally approved disease-control guidance.",
        "prevention": "Maintain vineyard sanitation and good canopy ventilation.",
    },

    "grape_esca": {
        "symptoms": "Leaves may develop irregular yellow, brown or necrotic areas, and affected vines may show progressive decline.",
        "treatment": "Remove severely affected plant material where appropriate and consult local vineyard disease-management guidance.",
        "prevention": "Use healthy planting material and maintain good pruning and vineyard sanitation practices.",
    },

    "grape_leaf_blight": {
        "symptoms": "Leaf spots and areas of dead leaf tissue may develop, especially under favorable humid conditions.",
        "treatment": "Remove severely affected material where practical and improve canopy airflow.",
        "prevention": "Maintain sanitation, avoid prolonged leaf wetness and improve air circulation.",
    },

    "grape_healthy": {
        "symptoms": "No major disease symptoms detected.",
        "treatment": "No disease treatment is required.",
        "prevention": "Continue regular vineyard monitoring, balanced nutrition and proper irrigation.",
    },

    "orange_huanglongbing": {
        "symptoms": "Leaves may show uneven yellowing or blotchy mottling, with weakened shoots and reduced plant vigor.",
        "treatment": "Confirm the diagnosis with local agricultural authorities or an agronomist. Manage infected plants and the disease vector according to local official recommendations.",
        "prevention": "Use certified healthy planting material and monitor and manage the insect vector according to local guidance.",
    },

    "peach_bacterial_spot": {
        "symptoms": "Small dark spots can develop on leaves and fruit, sometimes causing holes or premature leaf damage.",
        "treatment": "Remove severely affected material where practical and follow locally approved bacterial-disease management.",
        "prevention": "Maintain orchard sanitation, airflow and avoid unnecessary leaf wetness.",
    },

    "peach_healthy": {
        "symptoms": "No major disease symptoms detected.",
        "treatment": "No disease treatment is required.",
        "prevention": "Maintain proper irrigation, nutrition, sanitation and orchard airflow.",
    },

    "pepper_bacterial_spot": {
        "symptoms": "Small dark water-soaked or brown spots may appear on leaves and fruit.",
        "treatment": "Remove severely affected plant material and avoid working with wet plants. Follow locally approved bacterial-disease guidance.",
        "prevention": "Use clean planting material, avoid overhead irrigation and maintain field sanitation.",
    },

    "pepper_healthy": {
        "symptoms": "No major disease symptoms detected.",
        "treatment": "No disease treatment is required.",
        "prevention": "Maintain balanced nutrition, irrigation and regular crop scouting.",
    },

    "potato_early_blight": {
        "symptoms": "Brown circular or irregular leaf spots may develop, often with concentric ring patterns.",
        "treatment": "Remove severely affected plant debris and improve crop management. Follow locally approved early-blight control guidance.",
        "prevention": "Use healthy planting material, crop rotation and good field sanitation.",
    },

    "potato_late_blight": {
        "symptoms": "Dark water-soaked leaf lesions can expand rapidly, especially during cool and humid conditions.",
        "treatment": "Remove heavily affected material and seek prompt local disease-management advice because late blight can spread quickly.",
        "prevention": "Use healthy seed, avoid prolonged leaf wetness and monitor crops frequently during favorable weather.",
    },

    "potato_healthy": {
        "symptoms": "No major disease symptoms detected.",
        "treatment": "No disease treatment is required.",
        "prevention": "Maintain healthy seed, balanced nutrition, proper irrigation and regular scouting.",
    },

    "raspberry_healthy": {
        "symptoms": "No major disease symptoms detected.",
        "treatment": "No disease treatment is required.",
        "prevention": "Maintain good airflow, sanitation, irrigation and balanced nutrition.",
    },

    "soybean_healthy": {
        "symptoms": "No major disease symptoms detected.",
        "treatment": "No disease treatment is required.",
        "prevention": "Continue regular scouting, balanced nutrition and appropriate irrigation.",
    },

    "squash_powdery_mildew": {
        "symptoms": "White powder-like growth may appear on leaf surfaces and can gradually cover larger areas.",
        "treatment": "Remove severely affected leaves where practical and improve airflow. Follow locally approved powdery-mildew guidance.",
        "prevention": "Maintain good plant spacing, airflow and avoid excessive nitrogen.",
    },

    "strawberry_leaf_scorch": {
        "symptoms": "Small dark purple to brown spots may develop and expand, giving leaves a scorched appearance.",
        "treatment": "Remove severely affected leaves and maintain field sanitation. Follow local disease-management guidance if symptoms continue.",
        "prevention": "Use healthy planting material, maintain airflow and remove infected debris.",
    },

    "strawberry_healthy": {
        "symptoms": "No major disease symptoms detected.",
        "treatment": "No disease treatment is required.",
        "prevention": "Maintain sanitation, balanced nutrition, proper irrigation and regular monitoring.",
    },

    "tomato_bacterial_spot": {
        "symptoms": "Small dark spots may appear on leaves, stems or fruit and can enlarge under warm and humid conditions.",
        "treatment": "Remove severely affected material, avoid handling wet plants and follow locally approved bacterial-disease management.",
        "prevention": "Use clean seed or transplants, maintain sanitation and avoid unnecessary overhead irrigation.",
    },

    "tomato_early_blight": {
        "symptoms": "Dark brown leaf spots with concentric ring patterns may develop, often starting on older leaves.",
        "treatment": "Remove severely affected lower leaves and plant debris and improve airflow. Follow locally approved early-blight management guidance.",
        "prevention": "Use crop rotation, maintain field sanitation and avoid prolonged leaf wetness.",
    },

    "tomato_late_blight": {
        "symptoms": "Dark, water-soaked lesions can develop and spread quickly across leaves and stems under cool, wet conditions.",
        "treatment": "Remove severely affected material promptly and seek local agricultural guidance because late blight can spread rapidly.",
        "prevention": "Monitor crops during cool and wet weather, avoid prolonged leaf wetness and maintain good airflow.",
    },

    "tomato_leaf_mold": {
        "symptoms": "Yellow patches may appear on the upper leaf surface with olive-green to brown mold growth underneath.",
        "treatment": "Remove affected leaves and improve ventilation. Follow locally approved disease-management recommendations.",
        "prevention": "Improve greenhouse or field airflow and avoid excessive humidity and leaf wetness.",
    },

    "tomato_septoria_leaf_spot": {
        "symptoms": "Small circular spots with dark borders and lighter centers can develop, usually on older leaves.",
        "treatment": "Remove affected lower leaves and plant debris and improve airflow. Follow locally approved management guidance.",
        "prevention": "Use field sanitation, crop rotation and avoid overhead irrigation where practical.",
    },

    "tomato_spider_mites": {
        "symptoms": "Leaves may develop fine yellow or pale speckling and can become dry or bronzed. Fine webbing may be visible in severe infestations.",
        "treatment": "Inspect leaf undersides and use locally recommended integrated pest-management practices. Avoid unnecessary broad-spectrum pesticide use.",
        "prevention": "Reduce plant stress, maintain appropriate irrigation and regularly scout leaf undersides.",
    },

    "tomato_target_spot": {
        "symptoms": "Brown circular spots with concentric target-like rings may appear on leaves and other plant parts.",
        "treatment": "Remove severely affected leaves and plant debris and improve airflow. Follow locally approved disease-management guidance.",
        "prevention": "Maintain crop sanitation, good spacing and avoid prolonged leaf wetness.",
    },

    "tomato_yellow_leaf_curl_virus": {
        "symptoms": "Leaves may curl upward and become yellow, with reduced plant growth and smaller leaves.",
        "treatment": "Confirm the diagnosis locally and manage the insect vector according to local agricultural recommendations. Remove severely affected plants where advised.",
        "prevention": "Use healthy planting material and monitor and manage whitefly vectors according to local guidance.",
    },

    "tomato_mosaic_virus": {
        "symptoms": "Leaves may show green and light-green mosaic patterns, distortion and reduced plant growth.",
        "treatment": "There is no direct cure for a virus-infected plant. Remove severely affected plants where locally recommended and control spread through sanitation.",
        "prevention": "Use clean planting material, sanitize tools and hands and avoid spreading sap between plants.",
    },

    "tomato_healthy": {
        "symptoms": "No major disease symptoms detected.",
        "treatment": "No disease treatment is required. Continue normal tomato crop care.",
        "prevention": "Monitor leaves regularly, maintain balanced nutrition and irrigation and keep the field clean.",
    },
}


def normalize_disease_name(predicted_class):
    """
    Converts PlantVillage class names into a lookup key.

    Example:
    Tomato___Early_blight
    ->
    tomato_early_blight
    """

    value = str(
        predicted_class or ""
    ).strip().lower()

    value = value.replace(
        "___",
        "_",
    )

    value = value.replace(
        " ",
        "_",
    )

    value = value.replace(
        "-",
        "_",
    )

    while "__" in value:
        value = value.replace(
            "__",
            "_",
        )

    return value


def build_disease_recommendation(predicted_class, status):
    if status != "success":
        return "AI model could not complete the diagnosis. Please ensure the trained model files are available."

    key = normalize_disease_name(predicted_class)
    info = DISEASE_INFO.get(key)

    if not info:
        return (
            f"Detected class: {predicted_class}\n\n"
            "Symptoms: Confirm the visible symptoms with the crop and field condition.\n\n"
            "Treatment / Action: Review the result with a local agricultural expert before applying any treatment.\n\n"
            "Prevention: Maintain crop sanitation, balanced nutrition, appropriate irrigation and regular disease scouting."
        )

    return (
        f"🌱 Symptoms\n{info['symptoms']}\n\n"
        f"💊 Treatment / Action\n{info['treatment']}\n\n"
        f"🛡️ Prevention\n{info['prevention']}"
    )

@app.post("/api/diagnosis", response_model=DiagnosisOut, status_code=201)
async def diagnosis(
    image: UploadFile = File(...),
    crop: str | None = Form(None),
    u: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    if image.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(415, "Only JPEG, PNG and WebP are supported")

    data = await image.read()

    if not data or len(data) > settings().max_upload_mb * 1024 * 1024:
        raise HTTPException(413, "Invalid or oversized image")

    name = f"{u.id}_{__import__('uuid').uuid4().hex}{__import__('pathlib').Path(image.filename or 'x.jpg').suffix}"
    Path(settings().upload_dir, name).write_bytes(data)

    pred, conf, status = predict(data, None)
    rec = build_disease_recommendation(pred, status)

    d = Diagnosis(
        user_id=u.id,
        crop_id=None,
        image_path=str(Path(settings().upload_dir, name)),
        predicted_class=pred,
        confidence=conf,
        status=status,
        recommendation=rec,
    )

    db.add(d)
    db.commit()
    db.refresh(d)

    return d
