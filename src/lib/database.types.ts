export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          id: string
          rol: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rol?: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rol?: Database["public"]["Enums"]["admin_role"]
          user_id?: string
        }
        Relationships: [
          { foreignKeyName: "admins_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "users"; referencedColumns: ["id"] }
        ]
      }
      audit_events: {
        Row: { datos: Json; entidad: string; entidad_id: string; id: string; timestamp: string; tipo: string; usuario_id: string; usuario_rol: string }
        Insert: { datos?: Json; entidad: string; entidad_id: string; id?: string; timestamp?: string; tipo: string; usuario_id: string; usuario_rol: string }
        Update: { datos?: Json; entidad?: string; entidad_id?: string; id?: string; timestamp?: string; tipo?: string; usuario_id?: string; usuario_rol?: string }
        Relationships: []
      }
      conductores: {
        Row: { created_at: string; dominio_default: string | null; id: string; updated_at: string; user_id: string }
        Insert: { created_at?: string; dominio_default?: string | null; id?: string; updated_at?: string; user_id: string }
        Update: { created_at?: string; dominio_default?: string | null; id?: string; updated_at?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "conductores_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "users"; referencedColumns: ["id"] }]
      }
      configuracion_normativa: {
        Row: { horario_diurno_fin_sabado: string; horario_diurno_fin_semana: string; horario_diurno_inicio: string; horario_nocturno_fin: string; horario_nocturno_inicio: string; id: string; vigente_desde: string }
        Insert: { horario_diurno_fin_sabado?: string; horario_diurno_fin_semana?: string; horario_diurno_inicio?: string; horario_nocturno_fin?: string; horario_nocturno_inicio?: string; id?: string; vigente_desde?: string }
        Update: { horario_diurno_fin_sabado?: string; horario_diurno_fin_semana?: string; horario_diurno_inicio?: string; horario_nocturno_fin?: string; horario_nocturno_inicio?: string; id?: string; vigente_desde?: string }
        Relationships: []
      }
      cuadras: {
        Row: { id: string; nombre: string; zona_id: string }
        Insert: { id?: string; nombre: string; zona_id: string }
        Update: { id?: string; nombre?: string; zona_id?: string }
        Relationships: [{ foreignKeyName: "cuadras_zona_id_fkey"; columns: ["zona_id"]; isOneToOne: false; referencedRelation: "zonas"; referencedColumns: ["id"] }]
      }
      deudas: {
        Row: { created_at: string; cuadra_id: string; dominio: string; estado: Database["public"]["Enums"]["debt_status"]; fecha: string; id: string; minutos_excedidos: number | null; monto: number; pagado_at: string | null; pago_id: string | null; permisionario_id: string; ticket_original_id: string | null; tipo: Database["public"]["Enums"]["debt_type"]; vencimiento_original: string | null }
        Insert: { created_at?: string; cuadra_id: string; dominio: string; estado?: Database["public"]["Enums"]["debt_status"]; fecha?: string; id?: string; minutos_excedidos?: number | null; monto: number; pagado_at?: string | null; pago_id?: string | null; permisionario_id: string; ticket_original_id?: string | null; tipo?: Database["public"]["Enums"]["debt_type"]; vencimiento_original?: string | null }
        Update: { created_at?: string; cuadra_id?: string; dominio?: string; estado?: Database["public"]["Enums"]["debt_status"]; fecha?: string; id?: string; minutos_excedidos?: number | null; monto?: number; pagado_at?: string | null; pago_id?: string | null; permisionario_id?: string; ticket_original_id?: string | null; tipo?: Database["public"]["Enums"]["debt_type"]; vencimiento_original?: string | null }
        Relationships: [
          { foreignKeyName: "deudas_cuadra_id_fkey"; columns: ["cuadra_id"]; isOneToOne: false; referencedRelation: "cuadras"; referencedColumns: ["id"] },
          { foreignKeyName: "deudas_permisionario_id_fkey"; columns: ["permisionario_id"]; isOneToOne: false; referencedRelation: "permisionarios"; referencedColumns: ["id"] }
        ]
      }
      emergencias: {
        Row: { cuadra_id: string; id: string; lat: number; lng: number; notas: string | null; origen_id: string; origen_rol: string; permisionario_id: string; resuelta: boolean; resuelto_at: string | null; timestamp: string; tipo: Database["public"]["Enums"]["emergency_type"] }
        Insert: { cuadra_id: string; id?: string; lat: number; lng: number; notas?: string | null; origen_id: string; origen_rol: string; permisionario_id: string; resuelta?: boolean; resuelto_at?: string | null; timestamp?: string; tipo: Database["public"]["Enums"]["emergency_type"] }
        Update: { cuadra_id?: string; id?: string; lat?: number; lng?: number; notas?: string | null; origen_id?: string; origen_rol?: string; permisionario_id?: string; resuelta?: boolean; resuelto_at?: string | null; timestamp?: string; tipo?: Database["public"]["Enums"]["emergency_type"] }
        Relationships: [
          { foreignKeyName: "emergencias_cuadra_id_fkey"; columns: ["cuadra_id"]; isOneToOne: false; referencedRelation: "cuadras"; referencedColumns: ["id"] },
          { foreignKeyName: "emergencias_permisionario_id_fkey"; columns: ["permisionario_id"]; isOneToOne: false; referencedRelation: "permisionarios"; referencedColumns: ["id"] }
        ]
      }
      estacionamientos: {
        Row: { created_at: string; cuadra_id: string; dominio: string; duracion_minutos: number; estado: Database["public"]["Enums"]["estacionamiento_status"]; fin: string | null; hora_registro: string; id: string; inicio: string; metodo_pago: Database["public"]["Enums"]["payment_method"]; origen: Database["public"]["Enums"]["estacionamiento_origen"]; permisionario_id: string; registrado_por: string | null; tipo: Database["public"]["Enums"]["vehicle_type"]; transferido: boolean; updated_at: string; zona_id: string }
        Insert: { created_at?: string; cuadra_id: string; dominio: string; duracion_minutos: number; estado?: Database["public"]["Enums"]["estacionamiento_status"]; fin?: string | null; hora_registro: string; id?: string; inicio: string; metodo_pago?: Database["public"]["Enums"]["payment_method"]; origen?: Database["public"]["Enums"]["estacionamiento_origen"]; permisionario_id: string; registrado_por?: string | null; tipo?: Database["public"]["Enums"]["vehicle_type"]; transferido?: boolean; updated_at?: string; zona_id: string }
        Update: { created_at?: string; cuadra_id?: string; dominio?: string; duracion_minutos?: number; estado?: Database["public"]["Enums"]["estacionamiento_status"]; fin?: string | null; hora_registro?: string; id?: string; inicio?: string; metodo_pago?: Database["public"]["Enums"]["payment_method"]; origen?: Database["public"]["Enums"]["estacionamiento_origen"]; permisionario_id?: string; registrado_por?: string | null; tipo?: Database["public"]["Enums"]["vehicle_type"]; transferido?: boolean; updated_at?: string; zona_id?: string }
        Relationships: [
          { foreignKeyName: "estacionamientos_cuadra_id_fkey"; columns: ["cuadra_id"]; isOneToOne: false; referencedRelation: "cuadras"; referencedColumns: ["id"] },
          { foreignKeyName: "estacionamientos_permisionario_id_fkey"; columns: ["permisionario_id"]; isOneToOne: false; referencedRelation: "permisionarios"; referencedColumns: ["id"] },
          { foreignKeyName: "estacionamientos_zona_id_fkey"; columns: ["zona_id"]; isOneToOne: false; referencedRelation: "zonas"; referencedColumns: ["id"] }
        ]
      }
      feriados: {
        Row: { descripcion: string; fecha: string; id: string }
        Insert: { descripcion: string; fecha: string; id?: string }
        Update: { descripcion?: string; fecha?: string; id?: string }
        Relationships: []
      }
      horarios_permisionario: {
        Row: { activo: boolean; created_at: string; dia: Database["public"]["Enums"]["day_of_week"]; hora_fin: string; hora_inicio: string; id: string; permisionario_id: string; turno: Database["public"]["Enums"]["turn_type"]; updated_at: string }
        Insert: { activo?: boolean; created_at?: string; dia: Database["public"]["Enums"]["day_of_week"]; hora_fin?: string; hora_inicio?: string; id?: string; permisionario_id: string; turno: Database["public"]["Enums"]["turn_type"]; updated_at?: string }
        Update: { activo?: boolean; created_at?: string; dia?: Database["public"]["Enums"]["day_of_week"]; hora_fin?: string; hora_inicio?: string; id?: string; permisionario_id?: string; turno?: Database["public"]["Enums"]["turn_type"]; updated_at?: string }
        Relationships: [{ foreignKeyName: "horarios_permisionario_permisionario_id_fkey"; columns: ["permisionario_id"]; isOneToOne: false; referencedRelation: "permisionarios"; referencedColumns: ["id"] }]
      }
      liquidaciones: {
        Row: { created_at: string; cuota_municipal: number; estado: Database["public"]["Enums"]["liquidacion_status"]; id: string; monto_liquidado: number; periodo: string; permisionario_id: string; total_recaudado: number; transferido_at: string | null }
        Insert: { created_at?: string; cuota_municipal: number; estado?: Database["public"]["Enums"]["liquidacion_status"]; id?: string; monto_liquidado: number; periodo: string; permisionario_id: string; total_recaudado: number; transferido_at?: string | null }
        Update: { created_at?: string; cuota_municipal?: number; estado?: Database["public"]["Enums"]["liquidacion_status"]; id?: string; monto_liquidado?: number; periodo?: string; permisionario_id?: string; total_recaudado?: number; transferido_at?: string | null }
        Relationships: [{ foreignKeyName: "liquidaciones_permisionario_id_fkey"; columns: ["permisionario_id"]; isOneToOne: false; referencedRelation: "permisionarios"; referencedColumns: ["id"] }]
      }
      pagos: {
        Row: { conductor_id: string | null; created_at: string; cuadra_id: string; dominio: string; estacionamiento_id: string | null; estado: Database["public"]["Enums"]["payment_status"]; id: string; metodo_pago: Database["public"]["Enums"]["payment_method"]; monto: number; mp_preference_id: string | null; mp_transaction_id: string | null; permisionario_id: string; ticket_id: string | null; updated_at: string }
        Insert: { conductor_id?: string | null; created_at?: string; cuadra_id: string; dominio: string; estacionamiento_id?: string | null; estado?: Database["public"]["Enums"]["payment_status"]; id?: string; metodo_pago?: Database["public"]["Enums"]["payment_method"]; monto: number; mp_preference_id?: string | null; mp_transaction_id?: string | null; permisionario_id: string; ticket_id?: string | null; updated_at?: string }
        Update: { conductor_id?: string | null; created_at?: string; cuadra_id?: string; dominio?: string; estacionamiento_id?: string | null; estado?: Database["public"]["Enums"]["payment_status"]; id?: string; metodo_pago?: Database["public"]["Enums"]["payment_method"]; monto?: number; mp_preference_id?: string | null; mp_transaction_id?: string | null; permisionario_id?: string; ticket_id?: string | null; updated_at?: string }
        Relationships: [
          { foreignKeyName: "fk_pagos_ticket"; columns: ["ticket_id"]; isOneToOne: false; referencedRelation: "tickets"; referencedColumns: ["id"] },
          { foreignKeyName: "pagos_permisionario_id_fkey"; columns: ["permisionario_id"]; isOneToOne: false; referencedRelation: "permisionarios"; referencedColumns: ["id"] }
        ]
      }
      permisionarios: {
        Row: { activo: boolean; activo_desde: string; alias_mercado_pago: string | null; created_at: string; cuadra_id: string; foto: string | null; id: string; legajo: string; qr_code: string | null; updated_at: string; user_id: string; zona_id: string }
        Insert: { activo?: boolean; activo_desde?: string; alias_mercado_pago?: string | null; created_at?: string; cuadra_id: string; foto?: string | null; id?: string; legajo: string; qr_code?: string | null; updated_at?: string; user_id: string; zona_id: string }
        Update: { activo?: boolean; activo_desde?: string; alias_mercado_pago?: string | null; created_at?: string; cuadra_id?: string; foto?: string | null; id?: string; legajo?: string; qr_code?: string | null; updated_at?: string; user_id?: string; zona_id?: string }
        Relationships: [
          { foreignKeyName: "permisionarios_cuadra_id_fkey"; columns: ["cuadra_id"]; isOneToOne: false; referencedRelation: "cuadras"; referencedColumns: ["id"] },
          { foreignKeyName: "permisionarios_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "permisionarios_zona_id_fkey"; columns: ["zona_id"]; isOneToOne: false; referencedRelation: "zonas"; referencedColumns: ["id"] }
        ]
      }
      tarifas: {
        Row: { auto_hora: number; created_at: string; descuento_digital: number; fraccionamiento_desde_hora: number; fraccionamiento_minutos: number; id: string; moto_hora: number; tolerancia_minutos: number; vigente_desde: string }
        Insert: { auto_hora?: number; created_at?: string; descuento_digital?: number; fraccionamiento_desde_hora?: number; fraccionamiento_minutos?: number; id?: string; moto_hora?: number; tolerancia_minutos?: number; vigente_desde?: string }
        Update: { auto_hora?: number; created_at?: string; descuento_digital?: number; fraccionamiento_desde_hora?: number; fraccionamiento_minutos?: number; id?: string; moto_hora?: number; tolerancia_minutos?: number; vigente_desde?: string }
        Relationships: []
      }
      tickets: {
        Row: { activo: boolean; conductor_id: string | null; created_at: string; cuadra_id: string; descuento_aplicado: boolean; dominio: string; duracion_minutos: number; id: string; inicio: string; metodo_pago: Database["public"]["Enums"]["payment_method"]; monto: number; numero: string; permisionario_id: string; tipo: Database["public"]["Enums"]["vehicle_type"]; vencimiento: string }
        Insert: { activo?: boolean; conductor_id?: string | null; created_at?: string; cuadra_id: string; descuento_aplicado?: boolean; dominio: string; duracion_minutos: number; id?: string; inicio: string; metodo_pago?: Database["public"]["Enums"]["payment_method"]; monto: number; numero: string; permisionario_id: string; tipo?: Database["public"]["Enums"]["vehicle_type"]; vencimiento: string }
        Update: { activo?: boolean; conductor_id?: string | null; created_at?: string; cuadra_id?: string; descuento_aplicado?: boolean; dominio?: string; duracion_minutos?: number; id?: string; inicio?: string; metodo_pago?: Database["public"]["Enums"]["payment_method"]; monto?: number; numero?: string; permisionario_id?: string; tipo?: Database["public"]["Enums"]["vehicle_type"]; vencimiento?: string }
        Relationships: [
          { foreignKeyName: "tickets_cuadra_id_fkey"; columns: ["cuadra_id"]; isOneToOne: false; referencedRelation: "cuadras"; referencedColumns: ["id"] },
          { foreignKeyName: "tickets_permisionario_id_fkey"; columns: ["permisionario_id"]; isOneToOne: false; referencedRelation: "permisionarios"; referencedColumns: ["id"] }
        ]
      }
      users: {
        Row: { activo: boolean; apellido: string; created_at: string; email: string; id: string; nombre: string; password: string; rol: Database["public"]["Enums"]["user_role"]; telefono: string | null; updated_at: string }
        Insert: { activo?: boolean; apellido: string; created_at?: string; email: string; id?: string; nombre: string; password: string; rol?: Database["public"]["Enums"]["user_role"]; telefono?: string | null; updated_at?: string }
        Update: { activo?: boolean; apellido?: string; created_at?: string; email?: string; id?: string; nombre?: string; password?: string; rol?: Database["public"]["Enums"]["user_role"]; telefono?: string | null; updated_at?: string }
        Relationships: []
      }
      vehiculos: {
        Row: { conductor_id: string | null; dominio: string; id: string; tipo: Database["public"]["Enums"]["vehicle_type"] }
        Insert: { conductor_id?: string | null; dominio: string; id?: string; tipo?: Database["public"]["Enums"]["vehicle_type"] }
        Update: { conductor_id?: string | null; dominio?: string; id?: string; tipo?: Database["public"]["Enums"]["vehicle_type"] }
        Relationships: [{ foreignKeyName: "vehiculos_conductor_id_fkey"; columns: ["conductor_id"]; isOneToOne: false; referencedRelation: "conductores"; referencedColumns: ["id"] }]
      }
      vehiculos_observados: {
        Row: { cuadra_id: string; dominio: string; id: string; permisionario_id: string; timestamp: string }
        Insert: { cuadra_id: string; dominio: string; id?: string; permisionario_id: string; timestamp?: string }
        Update: { cuadra_id?: string; dominio?: string; id?: string; permisionario_id?: string; timestamp?: string }
        Relationships: [
          { foreignKeyName: "vehiculos_observados_cuadra_id_fkey"; columns: ["cuadra_id"]; isOneToOne: false; referencedRelation: "cuadras"; referencedColumns: ["id"] },
          { foreignKeyName: "vehiculos_observados_permisionario_id_fkey"; columns: ["permisionario_id"]; isOneToOne: false; referencedRelation: "permisionarios"; referencedColumns: ["id"] }
        ]
      }
      zonas: {
        Row: { created_at: string; id: string; nocturno_habilitado: boolean; nombre: string; updated_at: string }
        Insert: { created_at?: string; id?: string; nocturno_habilitado?: boolean; nombre: string; updated_at?: string }
        Update: { created_at?: string; id?: string; nocturno_habilitado?: boolean; nombre?: string; updated_at?: string }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      admin_role: "administrador" | "supervisor" | "consulta"
      day_of_week: "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo"
      debt_status: "pendiente" | "pagada" | "vencida"
      debt_type: "incumplimiento" | "hora_extra"
      emergency_type: "panico" | "disputa"
      estacionamiento_origen: "digital" | "efectivo" | "incumplimiento"
      estacionamiento_status: "activo" | "finalizado" | "vencido" | "incumplimiento"
      liquidacion_status: "pendiente" | "transferida"
      payment_method: "efectivo" | "digital"
      payment_status: "pending" | "success" | "failed"
      turn_type: "diurno" | "nocturno"
      user_role: "conductor" | "permisionario" | "admin"
      vehicle_type: "auto" | "moto"
    }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Tables<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Row"]

export type TablesInsert<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Insert"]

export type TablesUpdate<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Update"]