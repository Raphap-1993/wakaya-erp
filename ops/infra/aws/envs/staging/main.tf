locals {
  environment = "staging"
  name_prefix = "wakaya-erp-${local.environment}"
  common_tags = {
    Project     = "wakaya-erp"
    Environment = local.environment
    Owner       = "team-wakaya"
    CostCenter  = "WAKAYA-ERP"
    ManagedBy   = "terraform"
  }
}

variable "region"         { type = string default = "us-east-1" }
variable "domain_name"    { type = string default = "staging.wakayaecolodge.com" }
variable "hosted_zone_id" { type = string default = "" }

module "network" {
  source      = "../../modules/network"
  name_prefix = local.name_prefix
  cidr_block  = "10.30.0.0/16"
  az_count    = 3
  tags        = local.common_tags
}

module "compute" {
  source             = "../../modules/compute"
  name_prefix        = local.name_prefix
  vpc_id             = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids
  node_instance_type = "t3.large"
  node_min_size      = 2
  node_desired_size  = 3
  node_max_size      = 6
  tags               = local.common_tags
}

module "database" {
  source                = "../../modules/database"
  name_prefix           = local.name_prefix
  vpc_id                = module.network.vpc_id
  private_subnet_ids    = module.network.private_subnet_ids
  instance_class        = "db.t3.medium"
  allocated_storage     = 50
  backup_retention_days = 14
  multi_az              = false
  tags                  = local.common_tags
}
