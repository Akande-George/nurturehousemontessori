export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      resources: {
        Row: {
          id: string
          school_id: string
          title: string
          description: string | null
          type: string
          url: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          title: string
          description?: string | null
          type?: string
          url?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          title?: string
          description?: string | null
          type?: string
          url?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      kit_items: {
        Row: {
          id: string
          school_id: string
          section_key: string
          name: string
          required: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          section_key: string
          name: string
          required?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          section_key?: string
          name?: string
          required?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kit_items_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_posts: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string | null
          leaf_id: string | null
          school_id: string
          student_id: string
          teacher_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          leaf_id?: string | null
          school_id: string
          student_id: string
          teacher_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          leaf_id?: string | null
          school_id?: string
          student_id?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_posts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_posts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_posts_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_comments: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          kind: string
          school_id: string
          student_id: string
          suggested_move: string | null
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          kind: string
          school_id: string
          student_id: string
          suggested_move?: string | null
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          kind?: string
          school_id?: string
          student_id?: string
          suggested_move?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_comments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_comments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      after_school_enrollments: {
        Row: {
          enrolled_at: string
          id: string
          parent_id: string | null
          school_id: string
          student_id: string
        }
        Insert: {
          enrolled_at?: string
          id?: string
          parent_id?: string | null
          school_id: string
          student_id: string
        }
        Update: {
          enrolled_at?: string
          id?: string
          parent_id?: string | null
          school_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "after_school_enrollments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "after_school_enrollments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "after_school_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_scores: {
        Row: {
          academic_year: string
          ca: Json
          class_id: string
          exam: Json
          id: string
          school_id: string
          student_id: string
          subject_id: string
          term: Database["public"]["Enums"]["term"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          academic_year: string
          ca?: Json
          class_id: string
          exam?: Json
          id?: string
          school_id: string
          student_id: string
          subject_id: string
          term: Database["public"]["Enums"]["term"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          academic_year?: string
          ca?: Json
          class_id?: string
          exam?: Json
          id?: string
          school_id?: string
          student_id?: string
          subject_id?: string
          term?: Database["public"]["Enums"]["term"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_scores_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_scores_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_scores_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_scores_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          recorded_by: string | null
          school_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          school_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          school_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean
          audience: string
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          location: string | null
          school_id: string
          starts_at: string
          title: string
          type: string
        }
        Insert: {
          all_day?: boolean
          audience?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          school_id: string
          starts_at: string
          title: string
          type?: string
        }
        Update: {
          all_day?: boolean
          audience?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          school_id?: string
          starts_at?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      class_subject_teachers: {
        Row: {
          class_id: string
          id: string
          school_id: string
          subject_id: string
          teacher_id: string
        }
        Insert: {
          class_id: string
          id?: string
          school_id: string
          subject_id: string
          teacher_id: string
        }
        Update: {
          class_id?: string
          id?: string
          school_id?: string
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_subject_teachers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subject_teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subject_teachers_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subject_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string
          class_teacher_id: string | null
          created_at: string
          id: string
          level: number
          name: string
          school_id: string
        }
        Insert: {
          academic_year: string
          class_teacher_id?: string | null
          created_at?: string
          id?: string
          level?: number
          name: string
          school_id: string
        }
        Update: {
          academic_year?: string
          class_teacher_id?: string | null
          created_at?: string
          id?: string
          level?: number
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_class_teacher_id_fkey"
            columns: ["class_teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_practices: {
        Row: {
          curriculum_progress_id: string
          id: string
          practiced_on: string
        }
        Insert: {
          curriculum_progress_id: string
          id?: string
          practiced_on: string
        }
        Update: {
          curriculum_progress_id?: string
          id?: string
          practiced_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_practices_curriculum_progress_id_fkey"
            columns: ["curriculum_progress_id"]
            isOneToOne: false
            referencedRelation: "curriculum_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_progress: {
        Row: {
          id: string
          leaf_id: string
          school_id: string
          status: Database["public"]["Enums"]["curriculum_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          leaf_id: string
          school_id: string
          status?: Database["public"]["Enums"]["curriculum_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          leaf_id?: string
          school_id?: string
          status?: Database["public"]["Enums"]["curriculum_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_progress_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_activity_logs: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          log_date: string
          log_time: string | null
          notes: string | null
          school_id: string
          student_id: string
          teacher_id: string | null
          value: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          log_date: string
          log_time?: string | null
          notes?: string | null
          school_id: string
          student_id: string
          teacher_id?: string | null
          value?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          log_date?: string
          log_time?: string | null
          notes?: string | null
          school_id?: string
          student_id?: string
          teacher_id?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_activity_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_activity_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_activity_logs_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reports: {
        Row: {
          age_group: Database["public"]["Enums"]["age_group"]
          content: Json
          general_mood: string | null
          id: string
          report_date: string
          school_id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["daily_report_status"]
          student_id: string
          teacher_id: string | null
          updated_at: string
          week_label: string | null
        }
        Insert: {
          age_group: Database["public"]["Enums"]["age_group"]
          content?: Json
          general_mood?: string | null
          id?: string
          report_date: string
          school_id: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["daily_report_status"]
          student_id: string
          teacher_id?: string | null
          updated_at?: string
          week_label?: string | null
        }
        Update: {
          age_group?: Database["public"]["Enums"]["age_group"]
          content?: Json
          general_mood?: string | null
          id?: string
          report_date?: string
          school_id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["daily_report_status"]
          student_id?: string
          teacher_id?: string | null
          updated_at?: string
          week_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollment_applications: {
        Row: {
          child_name: string
          created_at: string
          details: Json
          id: string
          parent_email: string
          parent_name: string
          parent_phone: string | null
          school_id: string
          status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          child_name: string
          created_at?: string
          details?: Json
          id?: string
          parent_email: string
          parent_name: string
          parent_phone?: string | null
          school_id: string
          status?: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          child_name?: string
          created_at?: string
          details?: Json
          id?: string
          parent_email?: string
          parent_name?: string
          parent_phone?: string | null
          school_id?: string
          status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_applications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          class_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          school_id: string
          subject_id: string | null
          teacher_id: string | null
          title: string
        }
        Insert: {
          class_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          school_id: string
          subject_id?: string | null
          teacher_id?: string | null
          title: string
        }
        Update: {
          class_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          school_id?: string
          subject_id?: string | null
          teacher_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_submissions: {
        Row: {
          grade: string | null
          homework_id: string
          id: string
          note: string | null
          status: string
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          grade?: string | null
          homework_id: string
          id?: string
          note?: string | null
          status?: string
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          grade?: string | null
          homework_id?: string
          id?: string
          note?: string | null
          status?: string
          student_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_id: string
          status: Database["public"]["Enums"]["invitation_status"]
          student_id: string | null
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_id: string
          status?: Database["public"]["Enums"]["invitation_status"]
          student_id?: string | null
          token: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string
          status?: Database["public"]["Enums"]["invitation_status"]
          student_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_cents: number
          description: string
          due_date: string | null
          id: string
          invoice_no: string | null
          issued_at: string
          line_items: Json
          paid_at: string | null
          parent_id: string | null
          school_id: string
          status: Database["public"]["Enums"]["invoice_status"]
          student_id: string
          tax_cents: number
        }
        Insert: {
          amount_cents?: number
          description: string
          due_date?: string | null
          id?: string
          invoice_no?: string | null
          issued_at?: string
          line_items?: Json
          paid_at?: string | null
          parent_id?: string | null
          school_id: string
          status?: Database["public"]["Enums"]["invoice_status"]
          student_id: string
          tax_cents?: number
        }
        Update: {
          amount_cents?: number
          description?: string
          due_date?: string | null
          id?: string
          invoice_no?: string | null
          issued_at?: string
          line_items?: Json
          paid_at?: string | null
          parent_id?: string | null
          school_id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          student_id?: string
          tax_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          school_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          school_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notice_reads: {
        Row: {
          id: string
          notice_id: string
          parent_id: string
          read_at: string
        }
        Insert: {
          id?: string
          notice_id: string
          parent_id: string
          read_at?: string
        }
        Update: {
          id?: string
          notice_id?: string
          parent_id?: string
          read_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notice_reads_notice_id_fkey"
            columns: ["notice_id"]
            isOneToOne: false
            referencedRelation: "notices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notice_reads_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          audience: string
          author_id: string | null
          content: string
          created_at: string
          id: string
          school_id: string
          title: string
        }
        Insert: {
          audience?: string
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          school_id: string
          title: string
        }
        Update: {
          audience?: string
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          school_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notices_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notices_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      observations: {
        Row: {
          content: string
          created_at: string
          id: string
          leaf_id: string
          school_id: string
          student_id: string
          teacher_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          leaf_id: string
          school_id: string
          student_id: string
          teacher_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          leaf_id?: string
          school_id?: string
          student_id?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "observations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          parent_id: string
          post_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_id: string
          post_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "activity_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_color: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_platform_admin: boolean
        }
        Insert: {
          avatar_color?: string
          created_at?: string
          email: string
          full_name?: string
          id: string
          is_platform_admin?: boolean
        }
        Update: {
          avatar_color?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_platform_admin?: boolean
        }
        Relationships: []
      }
      progress: {
        Row: {
          academic_year: string | null
          areas: Json
          areas_for_growth: string[]
          character_ratings: Json
          id: string
          recommendations: Json
          school_id: string
          strengths: string[]
          student_id: string
          teacher_comments: string | null
          teacher_name: string | null
          term: string | null
          updated_at: string
        }
        Insert: {
          academic_year?: string | null
          areas?: Json
          areas_for_growth?: string[]
          character_ratings?: Json
          id?: string
          recommendations?: Json
          school_id: string
          strengths?: string[]
          student_id: string
          teacher_comments?: string | null
          teacher_name?: string | null
          term?: string | null
          updated_at?: string
        }
        Update: {
          academic_year?: string | null
          areas?: Json
          areas_for_growth?: string[]
          character_ratings?: Json
          id?: string
          recommendations?: Json
          school_id?: string
          strengths?: string[]
          student_id?: string
          teacher_comments?: string | null
          teacher_name?: string | null
          term?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      report_card_rows: {
        Row: {
          ca_total: number
          exam_score: number
          grade: string | null
          id: string
          remark: string | null
          report_card_id: string
          subject_id: string
          subject_position: number | null
          total: number
        }
        Insert: {
          ca_total?: number
          exam_score?: number
          grade?: string | null
          id?: string
          remark?: string | null
          report_card_id: string
          subject_id: string
          subject_position?: number | null
          total?: number
        }
        Update: {
          ca_total?: number
          exam_score?: number
          grade?: string | null
          id?: string
          remark?: string | null
          report_card_id?: string
          subject_id?: string
          subject_position?: number | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "report_card_rows_report_card_id_fkey"
            columns: ["report_card_id"]
            isOneToOne: false
            referencedRelation: "report_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_card_rows_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      report_cards: {
        Row: {
          academic_year: string
          average: number
          class_id: string
          class_size: number | null
          id: string
          overall_grade: string | null
          overall_position: number | null
          principal_remark: string | null
          promotion_status: Database["public"]["Enums"]["promotion_status"]
          published_at: string
          school_id: string
          student_id: string
          teacher_remark: string | null
          term: Database["public"]["Enums"]["term"]
          total_score: number
        }
        Insert: {
          academic_year: string
          average?: number
          class_id: string
          class_size?: number | null
          id?: string
          overall_grade?: string | null
          overall_position?: number | null
          principal_remark?: string | null
          promotion_status?: Database["public"]["Enums"]["promotion_status"]
          published_at?: string
          school_id: string
          student_id: string
          teacher_remark?: string | null
          term: Database["public"]["Enums"]["term"]
          total_score?: number
        }
        Update: {
          academic_year?: string
          average?: number
          class_id?: string
          class_size?: number | null
          id?: string
          overall_grade?: string | null
          overall_position?: number | null
          principal_remark?: string | null
          promotion_status?: Database["public"]["Enums"]["promotion_status"]
          published_at?: string
          school_id?: string
          student_id?: string
          teacher_remark?: string | null
          term?: Database["public"]["Enums"]["term"]
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "report_cards_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_cards_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_cards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          contact_email: string | null
          created_at: string
          id: string
          logo_url: string
          name: string
          phone: string | null
          programs: string[]
          slug: string
          status: Database["public"]["Enums"]["school_status"]
          theme: Json
          type: Database["public"]["Enums"]["school_type"]
        }
        Insert: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          logo_url?: string
          name: string
          phone?: string | null
          programs?: string[]
          slug: string
          status?: Database["public"]["Enums"]["school_status"]
          theme?: Json
          type: Database["public"]["Enums"]["school_type"]
        }
        Update: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          logo_url?: string
          name?: string
          phone?: string | null
          programs?: string[]
          slug?: string
          status?: Database["public"]["Enums"]["school_status"]
          theme?: Json
          type?: Database["public"]["Enums"]["school_type"]
        }
        Relationships: []
      }
      student_medications: {
        Row: {
          dosage: string | null
          id: string
          name: string
          notes: string | null
          student_id: string
          time: string | null
        }
        Insert: {
          dosage?: string | null
          id?: string
          name: string
          notes?: string | null
          student_id: string
          time?: string | null
        }
        Update: {
          dosage?: string | null
          id?: string
          name?: string
          notes?: string | null
          student_id?: string
          time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_medications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_parents: {
        Row: {
          id: string
          is_primary: boolean
          parent_id: string
          relationship: string | null
          student_id: string
        }
        Insert: {
          id?: string
          is_primary?: boolean
          parent_id: string
          relationship?: string | null
          student_id: string
        }
        Update: {
          id?: string
          is_primary?: boolean
          parent_id?: string
          relationship?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_parents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_parents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          age_group: Database["public"]["Enums"]["age_group"] | null
          allergies: string[]
          avatar_color: string
          class_id: string | null
          classroom: string | null
          created_at: string
          date_of_birth: string | null
          emergency_contact: Json | null
          enrolled_at: string | null
          frequent_late_pickup: boolean
          id: string
          interests: string[]
          medical_notes: string | null
          name: string
          school_id: string
          teacher_id: string | null
        }
        Insert: {
          age_group?: Database["public"]["Enums"]["age_group"] | null
          allergies?: string[]
          avatar_color?: string
          class_id?: string | null
          classroom?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact?: Json | null
          enrolled_at?: string | null
          frequent_late_pickup?: boolean
          id?: string
          interests?: string[]
          medical_notes?: string | null
          name: string
          school_id: string
          teacher_id?: string | null
        }
        Update: {
          age_group?: Database["public"]["Enums"]["age_group"] | null
          allergies?: string[]
          avatar_color?: string
          class_id?: string | null
          classroom?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact?: Json | null
          enrolled_at?: string | null
          frequent_late_pickup?: boolean
          id?: string
          interests?: string[]
          medical_notes?: string | null
          name?: string
          school_id?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
          school_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
          school_id: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_classroom_assignments: {
        Row: {
          classroom: string
          id: string
          school_id: string
          teacher_id: string
        }
        Insert: {
          classroom: string
          id?: string
          school_id: string
          teacher_id: string
        }
        Update: {
          classroom?: string
          id?: string
          school_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_classroom_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_classroom_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_periods: {
        Row: {
          class_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          school_id: string
          start_time: string
          subject_id: string | null
          teacher_id: string | null
        }
        Insert: {
          class_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          school_id: string
          start_time: string
          subject_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          school_id?: string
          start_time?: string
          subject_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetable_periods_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_periods_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_periods_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_periods_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      compute_report_card: {
        Args: {
          p_class_id: string
          p_term: Database["public"]["Enums"]["term"]
          p_year: string
        }
        Returns: {
          ca_total: number
          class_size: number
          exam_score: number
          grade: string
          overall_average: number
          overall_grade: string
          overall_position: number
          overall_total: number
          promotion_status: Database["public"]["Enums"]["promotion_status"]
          remark: string
          student_id: string
          subject_id: string
          subject_position: number
          total: number
        }[]
      }
      curriculum_stats: {
        Args: { p_student_id: string }
        Returns: {
          count: number
          status: Database["public"]["Enums"]["curriculum_status"]
        }[]
      }
      grade_for: { Args: { p: number }; Returns: string }
      is_parent_of: { Args: { p_student: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      is_school_admin: { Args: { p_school: string }; Returns: boolean }
      is_school_member: { Args: { p_school: string }; Returns: boolean }
      is_school_staff: { Args: { p_school: string }; Returns: boolean }
      platform_stats: {
        Args: never
        Returns: {
          class_count: number
          notice_count: number
          school_id: string
          staff_count: number
          student_count: number
        }[]
      }
      principal_remark_for: { Args: { p: number }; Returns: string }
      remark_for: { Args: { p: number }; Returns: string }
      student_school: { Args: { p_student: string }; Returns: string }
      teacher_remark_for: { Args: { p: number }; Returns: string }
    }
    Enums: {
      age_group: "infant_0_2" | "primary_3_6" | "lower_7_9"
      application_status: "submitted" | "accepted" | "rejected"
      attendance_status: "present" | "absent" | "late" | "excused"
      curriculum_status:
        | "not_started"
        | "introduced"
        | "developing"
        | "proficient"
      daily_report_status: "draft" | "sent"
      invitation_status: "pending" | "accepted" | "expired" | "revoked"
      invoice_status: "unpaid" | "paid"
      promotion_status: "promoted" | "repeated" | "pending"
      school_status: "active" | "pending" | "suspended"
      school_type: "montessori" | "regular"
      term: "first" | "second" | "third"
      user_role: "super_admin" | "admin" | "teacher" | "parent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      age_group: ["infant_0_2", "primary_3_6", "lower_7_9"],
      application_status: ["submitted", "accepted", "rejected"],
      attendance_status: ["present", "absent", "late", "excused"],
      curriculum_status: [
        "not_started",
        "introduced",
        "developing",
        "proficient",
      ],
      daily_report_status: ["draft", "sent"],
      invitation_status: ["pending", "accepted", "expired", "revoked"],
      invoice_status: ["unpaid", "paid"],
      promotion_status: ["promoted", "repeated", "pending"],
      school_status: ["active", "pending", "suspended"],
      school_type: ["montessori", "regular"],
      term: ["first", "second", "third"],
      user_role: ["super_admin", "admin", "teacher", "parent"],
    },
  },
} as const

