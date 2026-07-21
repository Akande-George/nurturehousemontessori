-- Phase 2 migration 1/7: extensions + enums
-- Fresh schema for the multi-school platform (supersedes the removed stale migration).

create extension if not exists pgcrypto; -- gen_random_uuid()

-- Roles a user can hold. super_admin is the global platform admin (no membership row).
create type user_role as enum ('super_admin', 'admin', 'teacher', 'parent');

create type school_type as enum ('montessori', 'regular');
create type school_status as enum ('active', 'pending', 'suspended');

create type term as enum ('first', 'second', 'third');
create type invoice_status as enum ('unpaid', 'paid');
create type promotion_status as enum ('promoted', 'repeated', 'pending');
create type daily_report_status as enum ('draft', 'sent');
create type attendance_status as enum ('present', 'absent', 'late', 'excused');

-- Montessori curriculum leaf status (mirrors demo-store CurriculumStatus).
create type curriculum_status as enum ('not_started', 'introduced', 'developing', 'proficient');

-- Daily-report age-band polymorphism.
create type age_group as enum ('infant_0_2', 'primary_3_6', 'lower_7_9');

create type application_status as enum ('submitted', 'accepted', 'rejected');
create type invitation_status as enum ('pending', 'accepted', 'expired', 'revoked');
