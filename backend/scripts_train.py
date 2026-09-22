import argparse
import json
import random
from pathlib import Path

import torch
from torch import nn
from torch.utils.data import DataLoader, Subset
from torchvision import datasets, transforms

from app.ai.disease import CNN


# =============================
# Arguments
# =============================
parser = argparse.ArgumentParser()

parser.add_argument(
    "--data-dir",
    required=True,
    help="Path to PlantVillage dataset"
)

parser.add_argument(
    "--epochs",
    type=int,
    default=15,
    help="Number of training epochs"
)

parser.add_argument(
    "--output-dir",
    default="weights",
    help="Directory where model will be saved"
)

parser.add_argument(
    "--images-per-class",
    type=int,
    default=300,
    help="Maximum images selected from each class"
)

parser.add_argument(
    "--batch-size",
    type=int,
    default=16,
    help="Training batch size"
)

args = parser.parse_args()


# =============================
# Reproducibility
# =============================
SEED = 42

random.seed(SEED)
torch.manual_seed(SEED)


# =============================
# Device
# =============================
device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print(f"Using device: {device}")


# =============================
# Training transformations
# =============================
train_transform = transforms.Compose([
    transforms.Resize((128, 128)),

    transforms.RandomHorizontalFlip(),

    transforms.RandomRotation(10),

    transforms.ColorJitter(
        brightness=0.15,
        contrast=0.15,
        saturation=0.15
    ),

    transforms.ToTensor(),

    transforms.Normalize(
        [0.5, 0.5, 0.5],
        [0.5, 0.5, 0.5]
    ),
])


# =============================
# Validation transformations
# =============================
val_transform = transforms.Compose([
    transforms.Resize((128, 128)),

    transforms.ToTensor(),

    transforms.Normalize(
        [0.5, 0.5, 0.5],
        [0.5, 0.5, 0.5]
    ),
])


# =============================
# Load dataset
# =============================
print("\nLoading dataset...")

train_source = datasets.ImageFolder(
    args.data_dir,
    transform=train_transform
)

val_source = datasets.ImageFolder(
    args.data_dir,
    transform=val_transform
)

num_classes = len(train_source.classes)

print(f"Total images available: {len(train_source)}")
print(f"Total classes: {num_classes}")


# =============================
# Create balanced subset
# =============================
print("\nCreating balanced dataset...")

class_indices = {
    class_id: []
    for class_id in range(num_classes)
}

for index, class_id in enumerate(train_source.targets):
    class_indices[class_id].append(index)


selected_indices = []

for class_id in range(num_classes):

    indices = class_indices[class_id].copy()

    random.Random(
        SEED + class_id
    ).shuffle(indices)

    selected_count = min(
        args.images_per_class,
        len(indices)
    )

    selected_indices.extend(
        indices[:selected_count]
    )


print(
    f"Selected images: {len(selected_indices)}"
)


# =============================
# Class distribution
# =============================
selected_class_counts = {
    class_id: 0
    for class_id in range(num_classes)
}

for index in selected_indices:

    selected_class_counts[
        train_source.targets[index]
    ] += 1


print("\nClass distribution:")

for class_id in range(num_classes):

    print(
        f"{train_source.classes[class_id]}: "
        f"{selected_class_counts[class_id]}"
    )


# =============================
# Stratified split
# =============================
print("\nCreating train/validation split...")

train_indices = []
val_indices = []

for class_id in range(num_classes):

    class_selected = [
        index
        for index in selected_indices
        if train_source.targets[index] == class_id
    ]

    random.Random(
        SEED + 1000 + class_id
    ).shuffle(class_selected)

    split = int(
        len(class_selected) * 0.8
    )

    train_indices.extend(
        class_selected[:split]
    )

    val_indices.extend(
        class_selected[split:]
    )


random.Random(SEED).shuffle(train_indices)
random.Random(SEED).shuffle(val_indices)


train_dataset = Subset(
    train_source,
    train_indices
)

val_dataset = Subset(
    val_source,
    val_indices
)


print(
    f"Training images: {len(train_dataset)}"
)

print(
    f"Validation images: {len(val_dataset)}"
)


# =============================
# Data loaders
# =============================
train_loader = DataLoader(
    train_dataset,
    batch_size=args.batch_size,
    shuffle=True,
    num_workers=0
)

val_loader = DataLoader(
    val_dataset,
    batch_size=args.batch_size,
    shuffle=False,
    num_workers=0
)


# =============================
# Model
# =============================
model = CNN(
    num_classes
).to(device)


# =============================
# Optimizer
# =============================
optimizer = torch.optim.Adam(
    model.parameters(),
    lr=0.001
)


# =============================
# Loss
# =============================
criterion = nn.CrossEntropyLoss()


# =============================
# Output directory
# =============================
output_directory = Path(
    args.output_dir
)

output_directory.mkdir(
    parents=True,
    exist_ok=True
)


model_path = (
    output_directory /
    "disease_model.pt"
)

classes_path = (
    output_directory /
    "classes.json"
)


# =============================
# Best model tracking
# =============================
best_val_accuracy = 0.0


# =============================
# Training loop
# =============================
for epoch in range(args.epochs):

    model.train()

    running_loss = 0.0
    correct = 0
    total = 0

    print(
        f"\nEpoch {epoch + 1}/{args.epochs}"
    )

    for batch_index, (
        images,
        labels
    ) in enumerate(
        train_loader,
        start=1
    ):

        images = images.to(device)
        labels = labels.to(device)

        optimizer.zero_grad()

        outputs = model(images)

        loss = criterion(
            outputs,
            labels
        )

        loss.backward()

        optimizer.step()

        running_loss += loss.item()

        predictions = outputs.argmax(
            dim=1
        )

        total += labels.size(0)

        correct += (
            predictions == labels
        ).sum().item()

        if batch_index % 50 == 0:

            print(
                f"Batch "
                f"{batch_index}/"
                f"{len(train_loader)} "
                f"| Loss: "
                f"{loss.item():.4f}"
            )


    # =========================
    # Training metrics
    # =========================
    train_accuracy = (
        100.0 * correct / total
        if total > 0
        else 0.0
    )

    average_loss = (
        running_loss / len(train_loader)
        if len(train_loader) > 0
        else 0.0
    )


    # =========================
    # Validation
    # =========================
    model.eval()

    val_correct = 0
    val_total = 0

    with torch.no_grad():

        for images, labels in val_loader:

            images = images.to(device)
            labels = labels.to(device)

            outputs = model(images)

            predictions = outputs.argmax(
                dim=1
            )

            val_total += labels.size(0)

            val_correct += (
                predictions == labels
            ).sum().item()


    val_accuracy = (
        100.0 * val_correct / val_total
        if val_total > 0
        else 0.0
    )


    # =========================
    # Results
    # =========================
    print(
        f"\nEpoch {epoch + 1} completed"
    )

    print(
        f"Training Loss: "
        f"{average_loss:.4f}"
    )

    print(
        f"Training Accuracy: "
        f"{train_accuracy:.2f}%"
    )

    print(
        f"Validation Accuracy: "
        f"{val_accuracy:.2f}%"
    )


    # =========================
    # Save BEST model
    # =========================
    if val_accuracy > best_val_accuracy:

        best_val_accuracy = val_accuracy

        torch.save(
            {
                "model_state": model.state_dict(),
                "validation_accuracy": val_accuracy,
            },
            model_path
        )

        classes_path.write_text(
            json.dumps(
                train_source.classes,
                indent=2
            )
        )

        print(
            f"✅ Best model saved "
            f"(Validation Accuracy: "
            f"{val_accuracy:.2f}%)"
        )


# =============================
# Finished
# =============================
print(
    "\nTraining completed successfully."
)

print(
    f"Best Validation Accuracy: "
    f"{best_val_accuracy:.2f}%"
)

print(
    f"Model saved: {model_path}"
)

print(
    f"Classes saved: {classes_path}"
)