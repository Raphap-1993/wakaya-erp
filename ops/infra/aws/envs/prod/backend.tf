terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.50" }
  }
  backend "s3" {
    bucket         = "wakaya-erp-tf-state"
    key            = "wakaya-erp/prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "wakaya-erp-tf-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.region
  default_tags { tags = local.common_tags }
}
