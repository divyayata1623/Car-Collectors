"""
AWS S3 service for product image uploads and CloudFront delivery.
"""
import os
import uuid
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
MAX_IMAGE_SIZE_MB = int(os.getenv("MAX_IMAGE_SIZE_MB", "5"))
MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
ALLOWED_IMAGE_TYPES = os.getenv("ALLOWED_IMAGE_TYPES", "image/jpeg,image/png,image/webp").split(",")


class S3Service:
    """
    AWS S3 service for handling product image uploads with validation and CloudFront CDN.
    """
    
    def __init__(self):
        """Initialize S3 client with AWS credentials."""
        try:
            self.s3_client = boto3.client(
                "s3",
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                region_name=AWS_REGION
            )
            self.bucket_name = AWS_S3_BUCKET_NAME
            self.cloudfront_domain = CLOUDFRONT_DOMAIN
        except (NoCredentialsError, Exception) as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to initialize S3 client: {str(e)}"
            )
    
    @staticmethod
    def validate_image(file: UploadFile) -> None:
        """
        Validate image format and size.
        
        Args:
            file: Uploaded file object
            
        Raises:
            HTTPException: If validation fails
        """
        # Validate content type
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid image format. Allowed types: {', '.join(ALLOWED_IMAGE_TYPES)}"
            )
        
        # Validate file size
        file.file.seek(0, 2)  # Seek to end of file
        file_size = file.file.tell()  # Get current position (file size)
        file.file.seek(0)  # Reset to beginning
        
        if file_size > MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image size exceeds maximum allowed size of {MAX_IMAGE_SIZE_MB}MB"
            )
        
        # Validate file is not empty
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty"
            )
    
    def upload_image(self, file: UploadFile, folder: str = "products") -> str:
        """
        Upload image to S3 and return CloudFront URL.
        
        Args:
            file: Uploaded file object
            folder: S3 folder/prefix (default: "products")
            
        Returns:
            CloudFront URL for the uploaded image
            
        Raises:
            HTTPException: If upload fails or validation fails
        """
        # Validate image
        self.validate_image(file)
        
        # Generate unique filename
        file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        unique_filename = f"{folder}/{uuid.uuid4()}.{file_extension}"
        
        try:
            # Upload to S3
            self.s3_client.upload_fileobj(
                file.file,
                self.bucket_name,
                unique_filename,
                ExtraArgs={
                    "ContentType": file.content_type,
                    "CacheControl": "max-age=31536000",  # 1 year cache
                    "ACL": "public-read"  # Make publicly readable
                }
            )
            
            # Return CloudFront URL
            cloudfront_url = f"https://{self.cloudfront_domain}/{unique_filename}"
            return cloudfront_url
            
        except ClientError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload image to S3: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Unexpected error during image upload: {str(e)}"
            )
    
    def upload_product_images(
        self, 
        front_image: UploadFile, 
        back_image: UploadFile
    ) -> Tuple[str, str]:
        """
        Upload both front and back package images for a product.
        
        Args:
            front_image: Front package image
            back_image: Back package image
            
        Returns:
            Tuple of (front_image_url, back_image_url)
            
        Raises:
            HTTPException: If upload fails for either image
        """
        front_url = self.upload_image(front_image, folder="products/front")
        back_url = self.upload_image(back_image, folder="products/back")
        
        return front_url, back_url
    
    def delete_image(self, image_url: str) -> bool:
        """
        Delete image from S3 bucket.
        
        Args:
            image_url: CloudFront URL of the image to delete
            
        Returns:
            True if deletion successful, False otherwise
        """
        try:
            # Extract S3 key from CloudFront URL
            # Example: https://d123.cloudfront.net/products/front/abc.jpg -> products/front/abc.jpg
            s3_key = image_url.replace(f"https://{self.cloudfront_domain}/", "")
            
            # Delete from S3
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            return True
            
        except ClientError as e:
            print(f"Failed to delete image from S3: {str(e)}")
            return False
        except Exception as e:
            print(f"Unexpected error during image deletion: {str(e)}")
            return False
    
    def delete_product_images(self, front_url: str, back_url: str) -> None:
        """
        Delete both front and back package images for a product.
        
        Args:
            front_url: Front package image URL
            back_url: Back package image URL
        """
        self.delete_image(front_url)
        self.delete_image(back_url)


# Singleton instance for reuse across the application
s3_service = S3Service()
