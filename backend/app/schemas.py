from datetime import date,datetime
from pydantic import BaseModel,EmailStr,Field,ConfigDict
class Register(BaseModel): email:EmailStr; password:str=Field(min_length=8,max_length=128); full_name:str=Field(min_length=2,max_length=150); phone:str|None=None; city:str=''; state:str=''; farm_size_acres:float|None=Field(default=None,ge=0); soil_type:str|None=None
class Token(BaseModel): access_token:str; token_type:str='bearer'
class ProfileIn(BaseModel): full_name:str=Field(min_length=2); phone:str|None=None; city:str=''; state:str=''; farm_size_acres:float|None=Field(default=None,ge=0); soil_type:str|None=None; latitude:float|None=Field(default=None,ge=-90,le=90); longitude:float|None=Field(default=None,ge=-180,le=180)
class ProfileOut(ProfileIn): model_config=ConfigDict(from_attributes=True); id:int; user_id:int
class CropIn(BaseModel): crop_type:str=Field(min_length=2); variety:str|None=None; area_acres:float=Field(gt=0); sowing_date:date|None=None; growth_stage:str='vegetative'; soil_type:str|None=None; nitrogen:float|None=Field(default=None,ge=0); phosphorus:float|None=Field(default=None,ge=0); potassium:float|None=Field(default=None,ge=0); soil_moisture:float|None=Field(default=None,ge=0,le=100); notes:str|None=None
class CropOut(CropIn): model_config=ConfigDict(from_attributes=True); id:int; user_id:int; status:str; created_at:datetime
class HistoryIn(BaseModel): event_type:str; description:str
class HistoryOut(HistoryIn): model_config=ConfigDict(from_attributes=True); id:int; crop_id:int; recorded_at:datetime
class FertilizerIn(BaseModel): crop_type:str; disease:str|None=None; nitrogen:float|None=None; phosphorus:float|None=None; potassium:float|None=None; growth_stage:str='vegetative'; area_acres:float=Field(default=1,gt=0)
class IrrigationIn(BaseModel): crop_type:str; growth_stage:str='vegetative'; soil_moisture:float|None=Field(default=None,ge=0,le=100); temperature_c:float|None=None; humidity_pct:float|None=Field(default=None,ge=0,le=100); rain_mm_next_24h:float=Field(default=0,ge=0); area_acres:float=Field(default=1,gt=0)
class Recommendation(BaseModel): title:str; priority:str; recommendation:str; rationale:list[str]; estimated_quantity:str|None=None
class ChatIn(BaseModel): message:str=Field(min_length=2,max_length=3000); crop_id:int|None=None
class DiagnosisOut(BaseModel): model_config=ConfigDict(from_attributes=True); id:int; crop_id:int|None; predicted_class:str; confidence:float; status:str; recommendation:str; created_at:datetime
