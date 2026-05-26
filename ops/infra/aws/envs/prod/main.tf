locals {
  environment = "prod"
  name_prefix = "wakaya-erp-${local.environment}"
  common_tags = {
    Project     = "wakaya-erp"
    Environment = local.environment
    Owner       = "team-wakaya"
    CostCenter  = "WAKAYA-ERP"
    ManagedBy   = "terraform"
    Compliance  = "internal-critical"
  }
}

variable "region"         { type = string default = "us-east-1" }
variable "domain_name"    { type = string default = "wakayaecolodge.com" }
variable "hosted_zone_id" { type = string }

module "network" {
  source      = "../../modules/network"
  name_prefix = local.name_prefix
  cidr_block  = "10.40.0.0/16"
  az_count    = 3
  tags        = local.common_tags
}

module "compute" {
  source             = "../../modules/compute"
  name_prefix        = local.name_prefix
  vpc_id             = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids
  node_instance_type = "m6i.large"
  node_min_size      = 3
  node_desired_size  = 5
  node_max_size      = 20
  tags               = local.common_tags
}

module "database" {
  source                = "../../modules/database"
  name_prefix           = local.name_prefix
  vpc_id                = module.network.vpc_id
  private_subnet_ids    = module.network.private_subnet_ids
  instance_class        = "db.m6g.large"
  allocated_storage     = 200
  backup_retention_days = 35
  multi_az              = true
  tags                  = local.common_tags
}

module "ingress" {
  source             = "../../modules/ingress"
  name_prefix        = local.name_prefix
  vpc_id             = module.network.vpc_id
  public_subnet_ids  = module.network.public_subnet_ids
  domain_name        = var.domain_name
  hosted_zone_id     = var.hosted_zone_id
  target_group_port  = 8080
  health_check_path  = "/api/health"
  tags               = local.common_tags
}
