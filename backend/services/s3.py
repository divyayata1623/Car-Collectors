"""
AWS S3 service with local storage fallback for product image uploads.
"""
import os
import uuid
import shutil
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from fastapi import HTTPException, UploadFile, status
from typing import Tuple

# AWS Configuration from environment variables
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_S3_BUCKET_NAME = os.getenv("AWS_S3_BUCKET_NAME")
CLOUDFRONT_DOMAIN = os.getenv("CLOUDFRONT_DOMAIN")

# Image upload settings
MAX_IMAGE_SIZE_MB = int(os.getenv("MAX_IMAGE_SIZE_MB", "10"))
MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
ALLOWED_IMAGE_TYPES = os.getenv("ALLOWED_IMAGE_TYPES", "image/jpeg,image/png,image/webp").split(",")


class S3Service:
    """
    Service for handling product image uploads with S3 and local storage fallback.
    """
    
    def __init__(self):
        """Initialize S3 client or fall back to local disk storage."""
        # Base uploads folder in backend directory
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.upload_dir = os.path.join(backend_dir, "uploads")
        os.makedirs(self.upload_dir, exist_ok=True)

        is_placeholder = (
            not AWS_ACCESS_KEY_ID or 
            "your_aws" in AWS_ACCESS_KEY_ID.lower() or 
            not AWS_SECRET_ACCESS_KEY or 
            "your_aws" in AWS_SECRET_ACCESS_KEY.lower()
        )

        if is_placeholder:
            self.use_local_storage = True
            self.s3_client = None
            self.bucket_name = None
            self.cloudfront_domain = None
        else:
            try:
                self.s3_client = boto3.client(
                    "s3",
                    aws_access_key_id=AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                    region_name=AWS_REGION
                )
                self.bucket_name = AWS_S3_BUCKET_NAME
                self.cloudfront_domain = CLOUDFRONT_DOMAIN
                self.use_local_storage = False
            except (NoCredentialsError, Exception):
                self.use_local_storage = True
                self.s3_client = None
                self.bucket_name = None
                self.cloudfront_domain = None
    
    @staticmethod
    def validate_image(file: UploadFile) -> None:
        """
        Validate image format and size.
        """
        # Validate content type
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid image format ({file.content_type}). Allowed types: {', '.join(ALLOWED_IMAGE_TYPES)}"
            )
        
        # Validate file size
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size > MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image size exceeds maximum allowed size of {MAX_IMAGE_SIZE_MB}MB"
            )
        
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty"
            )
    
    def _save_local_image(self, file: UploadFile, folder: str) -> str:
        """Save file to local disk and return relative /uploads path."""
        target_dir = os.path.join(self.upload_dir, folder)
        os.makedirs(target_dir, exist_ok=True)
        
        file_extension = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
        unique_name = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(target_dir, unique_name)
        
        file.file.seek(0)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return f"/uploads/{folder}/{unique_name}"

    def upload_image(self, file: UploadFile, folder: str = "products") -> str:
        """
        Upload image to S3 or local disk and return URL.
        """
        self.validate_image(file)
        
        if self.use_local_storage:
            return self._save_local_image(file, folder)
        
        # Generate unique filename for S3
        file_extension = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
        unique_filename = f"{folder}/{uuid.uuid4()}.{file_extension}"
        
        try:
            file.file.seek(0)
            self.s3_client.upload_fileobj(
                file.file,
                self.bucket_name,
                unique_filename,
                ExtraArgs={
                    "ContentType": file.content_type,
                    "CacheControl": "max-age=31536000",
                    "ACL": "public-read"
                }
            )
            cloudfront_url = f"https://{self.cloudfront_domain}/{unique_filename}"
            return cloudfront_url
        except Exception:
            # Fallback to local storage if S3 fails
            return self._save_local_image(file, folder)
    
    def upload_product_images(
        self, 
        front_image: UploadFile, 
        back_image: UploadFile
    ) -> Tuple[str, str]:
        """
        Upload both front and back package images for a product.
        """
        front_url = self.upload_image(front_image, folder="products/front")
        back_url = self.upload_image(back_image, folder="products/back")
        return front_url, back_url
    
    def delete_image(self, image_url: str) -> bool:
        """
        Delete image from local disk or S3 bucket.
        """
        if not image_url:
            return False
            
        try:
            if "/uploads/" in image_url:
                rel_part = image_url.split("/uploads/")[-1]
                local_path = os.path.join(self.upload_dir, rel_part.replace("/", os.sep))
                if os.path.exists(local_path):
                    os.remove(local_path)
                return True
            
            if self.s3_client and self.cloudfront_domain and self.cloudfront_domain in image_url:
                s3_key = image_url.replace(f"https://{self.cloudfront_domain}/", "")
                self.s3_client.delete_object(
                    Bucket=self.bucket_name,
                    Key=s3_key
                )
                return True
            return True
        except Exception as e:
            print(f"Failed to delete image: {str(e)}")
            return False
    
    def delete_product_images(self, front_url: str, back_url: str) -> None:
        """
        Delete both front and back package images for a product.
        """
        if front_url:
            self.delete_image(front_url)
        if back_url:
            self.delete_image(back_url)


# Singleton instance for reuse across the application
s3_service = S3Service()
