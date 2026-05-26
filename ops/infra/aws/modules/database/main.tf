# Modulo database: RDS PostgreSQL con subnet group, security group y backup.

terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.50" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
  }
}

variable "name_prefix"        { type = string }
variable "vpc_id"             { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "allowed_security_group_ids" { type = list(string) default = [] }
variable "instance_class"     { type = string default = "db.t3.medium" }
variable "allocated_storage"  { type = number default = 50 }
variable "engine_version"     { type = string default = "16.3" }
variable "backup_retention_days" { type = number default = 14 }
variable "multi_az"           { type = bool default = false }
variable "tags"               { type = map(string) default = {} }

resource "random_password" "master" {
  length  = 32
  special = true
}

resource "aws_db_subnet_group" "this" {
  name       = "${var.name_prefix}-db-subnets"
  subnet_ids = var.private_subnet_ids
  tags       = var.tags
}

resource "aws_security_group" "this" {
  name        = "${var.name_prefix}-db-sg"
  description = "Acceso restringido a RDS Postgres"
  vpc_id      = var.vpc_id
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.allowed_security_group_ids
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = var.tags
}

resource "aws_db_instance" "this" {
  identifier                   = "${var.name_prefix}-postgres"
  engine                       = "postgres"
  engine_version               = var.engine_version
  instance_class               = var.instance_class
  allocated_storage            = var.allocated_storage
  storage_encrypted            = true
  username                     = "postgres"
  password                     = random_password.master.result
  db_subnet_group_name         = aws_db_subnet_group.this.name
  vpc_security_group_ids       = [aws_security_group.this.id]
  backup_retention_period      = var.backup_retention_days
  backup_window                = "03:00-04:00"
  maintenance_window           = "Mon:04:30-Mon:05:30"
  multi_az                     = var.multi_az
  deletion_protection          = true
  skip_final_snapshot          = false
  final_snapshot_identifier    = "${var.name_prefix}-postgres-final"
  auto_minor_version_upgrade   = true
  performance_insights_enabled = true
  copy_tags_to_snapshot        = true
  tags                         = var.tags
}

output "db_endpoint"        { value = aws_db_instance.this.endpoint }
output "db_security_group"  { value = aws_security_group.this.id }
output "db_master_password" { value = random_password.master.result sensitive = true }
