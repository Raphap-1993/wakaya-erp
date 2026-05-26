locals {
  environment = "dev"
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
variable "domain_name"    { type = string default = "dev.wakayaecolodge.com" }
variable "hosted_zone_id" { type = string default = "" }

module "network" {
  source      = "../../modules/network"
  name_prefix = local.name_prefix
  cidr_block  = "10.20.0.0/16"
  az_count    = 2
  tags        = local.common_tags
}

module "compute" {
  source             = "../../modules/compute"
  name_prefix        = local.name_prefix
  vpc_id             = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids
  cluster_version    = "1.30"
  node_instance_type = "t3.medium"
  node_min_size      = 1
  node_desired_size  = 2
  node_max_size      = 3
  tags               = local.common_tags
}

module "database" {
  source                     = "../../modules/database"
  name_prefix                = local.name_prefix
  vpc_id                     = module.network.vpc_id
  private_subnet_ids         = module.network.private_subnet_ids
  allowed_security_group_ids = []
  instance_class             = "db.t3.small"
  allocated_storage          = 20
  engine_version             = "16.3"
  backup_retention_days      = 7
  multi_az                   = false
  tags                       = local.common_tags
}

output "cluster_name" { value = module.compute.cluster_name }
output "db_endpoint"  { value = module.database.db_endpoint }
