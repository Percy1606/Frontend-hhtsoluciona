"use client";

import { useState, useEffect, useCallback } from "react";
import {
  User,
  Edit2,
  X,
  Loader2,
  AlertTriangle,
  Briefcase,
  Mail,
  Phone,
  IdCard,
  Calendar,
  MapPin,
  Globe,
  Heart,
  Plane,
  Check,
  Save,
  ChevronDown,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { TrabajadorDocumentosView } from "@/components/configuracion/trabajador-documentos-view";

interface Worker {
  id: string;
  nombre: string;
  area: string;
  cargo: string;
  email: string | null;
  telefono: string | null;
  color: string;
  activo: boolean;
  dni: string | null;
  fechaNacimiento: string | null;
  sexo: string | null;
  estadoCivil: string | null;
  nacionalidad: string | null;
  direccion: string | null;
  distrito: string | null;
  ciudad: string | null;
  correoPersonal: string | null;
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;
  disponibilidadViajes: boolean | null;
}

const areaColors: Record<string, string> = {
  LogisticaYRecursos: "bg-blue-100 text-blue-700 border-blue-200",
  IngenieriaYSupervision: "bg-emerald-100 text-emerald-700 border-emerald-200",
  GestionDocumentaria: "bg-amber-100 text-amber-700 border-amber-200",
  OperacionesDeCampo: "bg-purple-100 text-purple-700 border-purple-200",
};

const calcularEdad = (fechaNacimiento: string | null | undefined) => {
  if (!fechaNacimiento) return "-";
  try {
    const hoy = new Date();
    const cumpleanos = new Date(fechaNacimiento);
    if (isNaN(cumpleanos.getTime())) return "-";
    let edad = hoy.getFullYear() - cumpleanos.getFullYear();
    const mes = hoy.getMonth() - cumpleanos.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < cumpleanos.getDate())) edad--;
    return `${edad} años`;
  } catch {
    return "-";
  }
};

interface MiPerfilModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MiPerfilModal({ isOpen, onClose }: MiPerfilModalProps) {
  const [profile, setProfile] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"perfil" | "documentos">("perfil");

  // Editable fields (only personal data the user can update themselves)
  const [editTelefono, setEditTelefono] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCorreoPersonal, setEditCorreoPersonal] = useState("");
  const [editDni, setEditDni] = useState("");
  const [editFechaNacimiento, setEditFechaNacimiento] = useState("");
  const [editSexo, setEditSexo] = useState("");
  const [editEstadoCivil, setEditEstadoCivil] = useState("");
  const [editNacionalidad, setEditNacionalidad] = useState("");
  const [editDireccion, setEditDireccion] = useState("");
  const [editDistrito, setEditDistrito] = useState("");
  const [editCiudad, setEditCiudad] = useState("");
  const [editContactoNombre, setEditContactoNombre] = useState("");
  const [editContactoTelefono, setEditContactoTelefono] = useState("");
  const [editDisponibilidadViajes, setEditDisponibilidadViajes] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get("/config/trabajadores/me");
      setProfile(data);
    } catch {
      setError(
        "No tienes un perfil de trabajador asignado. Contacta a un administrador."
      );
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchProfile();
  }, [isOpen, fetchProfile]);

  const startEditing = () => {
    if (!profile) return;
    setEditTelefono(profile.telefono || "");
    setEditEmail(profile.email || "");
    setEditCorreoPersonal(profile.correoPersonal || "");
    setEditDni(profile.dni || "");
    setEditFechaNacimiento(
      profile.fechaNacimiento ? profile.fechaNacimiento.split("T")[0] : ""
    );
    setEditSexo(profile.sexo || "");
    setEditEstadoCivil(profile.estadoCivil || "");
    setEditNacionalidad(profile.nacionalidad || "");
    setEditDireccion(profile.direccion || "");
    setEditDistrito(profile.distrito || "");
    setEditCiudad(profile.ciudad || "");
    setEditContactoNombre(profile.contactoEmergenciaNombre || "");
    setEditContactoTelefono(profile.contactoEmergenciaTelefono || "");
    setEditDisponibilidadViajes(profile.disponibilidadViajes ?? false);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!profile) return;

    if (editDni && !/^\d{8}$/.test(editDni)) {
      toast.error("El DNI debe tener exactamente 8 dígitos.");
      return;
    }
    if (editTelefono && !/^\d{9}$/.test(editTelefono)) {
      toast.error("El celular corporativo debe tener 9 dígitos.");
      return;
    }
    if (editContactoTelefono && !/^\d{9}$/.test(editContactoTelefono)) {
      toast.error("El teléfono de emergencia debe tener 9 dígitos.");
      return;
    }

    try {
      setSaving(true);
      const payload: Partial<Worker> = {
        telefono: editTelefono || null,
        email: editEmail || null,
        correoPersonal: editCorreoPersonal || null,
        dni: editDni || null,
        fechaNacimiento: editFechaNacimiento || null,
        sexo: editSexo || null,
        estadoCivil: editEstadoCivil || null,
        nacionalidad: editNacionalidad || null,
        direccion: editDireccion || null,
        distrito: editDistrito || null,
        ciudad: editCiudad || null,
        contactoEmergenciaNombre: editContactoNombre || null,
        contactoEmergenciaTelefono: editContactoTelefono || null,
        disponibilidadViajes: editDisponibilidadViajes,
      };
      await api.patch(`/config/trabajadores/${profile.id}`, payload);
      toast.success("¡Perfil actualizado correctamente!");
      setIsEditing(false);
      await fetchProfile();
    } catch {
      toast.error("Error al guardar el perfil. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#001F3F] flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Mi Perfil</h2>
              <p className="text-xs text-slate-500">
                Solo puedes ver y editar tu propia información
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile && !isEditing && (
              <Button
                onClick={startEditing}
                size="sm"
                className="bg-[#001F3F] hover:bg-[#003087] text-white rounded-xl h-8 px-4 text-xs font-semibold gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Editar
              </Button>
            )}
            {isEditing && (
              <>
                <Button
                  onClick={() => setIsEditing(false)}
                  size="sm"
                  variant="outline"
                  className="rounded-xl h-8 px-3 text-xs font-semibold"
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-8 px-4 text-xs font-semibold gap-1.5"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-[#001F3F]" />
              <p className="text-sm text-slate-500 animate-pulse">
                Cargando tu perfil...
              </p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
              <AlertTriangle className="h-8 w-8 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 text-sm">
                  Perfil no encontrado
                </p>
                <p className="text-amber-800/80 text-xs mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Profile content */}
          {profile && !loading && (
            <>
              {/* Identity card */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#001F3F]/5 to-[#003087]/5 border border-[#001F3F]/10 rounded-2xl">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-sm ${profile.color}`}
                >
                  {profile.nombre.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 truncate">
                    {profile.nombre}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {profile.cargo}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge
                      className={`${
                        areaColors[profile.area] ||
                        "bg-slate-100 text-slate-700"
                      } border shadow-none px-2.5 py-0.5 rounded-lg text-[10px] font-semibold`}
                    >
                      {profile.area.replace(/([A-Z])/g, " $1").trim()}
                    </Badge>
                    <Badge
                      className={
                        profile.activo
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1"
                          : "bg-rose-50 text-rose-700 border-rose-100 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1"
                      }
                    >
                      {profile.activo ? (
                        <Check className="h-2.5 w-2.5" />
                      ) : (
                        <X className="h-2.5 w-2.5" />
                      )}
                      {profile.activo ? "Activo" : "Baja"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex gap-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 w-fit">
                <button
                  type="button"
                  onClick={() => setActiveTab("perfil")}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "perfil"
                      ? "bg-[#001F3F] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Perfil Personal
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("documentos")}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "documentos"
                      ? "bg-[#001F3F] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Documentación y Expediente
                </button>
              </div>

              {activeTab === "documentos" ? (
                <TrabajadorDocumentosView workerId={profile.id} />
              ) : (
                <>
              {isEditing && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700">
                  <Edit2 className="w-3.5 h-3.5" />
                  Modo edición activo — modifica tus datos y presiona Guardar
                </div>
              )}

              {/* Contact info */}
              <Section
                title="Información de Contacto"
                icon={<Mail className="h-4 w-4 text-[#003087]" />}
              >
                <Field label="Correo Institucional" icon={<Mail className="h-3.5 w-3.5 text-slate-400" />}>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="correo@hhtsoluciona.com"
                      className={inputClass}
                    />
                  ) : (
                    <span>{profile.email || "Sin correo"}</span>
                  )}
                </Field>
                <Field label="Celular Corporativo" icon={<Phone className="h-3.5 w-3.5 text-slate-400" />}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTelefono}
                      onChange={(e) => setEditTelefono(e.target.value)}
                      placeholder="9 dígitos"
                      maxLength={9}
                      className={inputClass}
                    />
                  ) : (
                    <span>{profile.telefono || "Sin teléfono"}</span>
                  )}
                </Field>
                <Field label="Correo Personal" icon={<Mail className="h-3.5 w-3.5 text-slate-400" />}>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editCorreoPersonal}
                      onChange={(e) => setEditCorreoPersonal(e.target.value)}
                      placeholder="correo@gmail.com"
                      className={inputClass}
                    />
                  ) : (
                    <span>{profile.correoPersonal || "No registrado"}</span>
                  )}
                </Field>
              </Section>

              {/* Personal info */}
              <Section
                title="Información Personal"
                icon={<User className="h-4 w-4 text-[#003087]" />}
              >
                <Field label="DNI" icon={<IdCard className="h-3.5 w-3.5 text-slate-400" />}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editDni}
                      onChange={(e) => setEditDni(e.target.value)}
                      placeholder="8 dígitos"
                      maxLength={8}
                      className={inputClass}
                    />
                  ) : (
                    <span>{profile.dni || "No registrado"}</span>
                  )}
                </Field>
                <Field label="Fecha de Nacimiento" icon={<Calendar className="h-3.5 w-3.5 text-slate-400" />}>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editFechaNacimiento}
                      onChange={(e) => setEditFechaNacimiento(e.target.value)}
                      className={inputClass}
                    />
                  ) : (
                    <span>
                      {profile.fechaNacimiento
                        ? `${new Date(profile.fechaNacimiento).toLocaleDateString("es-ES")} (${calcularEdad(profile.fechaNacimiento)})`
                        : "No registrado"}
                    </span>
                  )}
                </Field>
                <Field label="Sexo">
                  {isEditing ? (
                    <div className="relative">
                      <select
                        value={editSexo}
                        onChange={(e) => setEditSexo(e.target.value)}
                        className={selectClass}
                      >
                        <option value="">Seleccionar</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  ) : (
                    <span>{profile.sexo || "No registrado"}</span>
                  )}
                </Field>
                <Field label="Estado Civil" icon={<Heart className="h-3.5 w-3.5 text-slate-400" />}>
                  {isEditing ? (
                    <div className="relative">
                      <select
                        value={editEstadoCivil}
                        onChange={(e) => setEditEstadoCivil(e.target.value)}
                        className={selectClass}
                      >
                        <option value="">Seleccionar</option>
                        <option value="Soltero/a">Soltero/a</option>
                        <option value="Casado/a">Casado/a</option>
                        <option value="Conviviente">Conviviente</option>
                        <option value="Divorciado/a">Divorciado/a</option>
                        <option value="Viudo/a">Viudo/a</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  ) : (
                    <span>{profile.estadoCivil || "No registrado"}</span>
                  )}
                </Field>
                <Field label="Nacionalidad" icon={<Globe className="h-3.5 w-3.5 text-slate-400" />}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editNacionalidad}
                      onChange={(e) => setEditNacionalidad(e.target.value)}
                      placeholder="Ej: Peruana"
                      className={inputClass}
                    />
                  ) : (
                    <span>{profile.nacionalidad || "No registrado"}</span>
                  )}
                </Field>
                <Field label="Disponibilidad Viajes" icon={<Plane className="h-3.5 w-3.5 text-slate-400" />}>
                  {isEditing ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editDisponibilidadViajes}
                        onChange={(e) => setEditDisponibilidadViajes(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#001F3F]"
                      />
                      <span className="text-xs font-medium text-slate-700">
                        {editDisponibilidadViajes ? "Disponible" : "No disponible"}
                      </span>
                    </label>
                  ) : (
                    <Badge
                      className={
                        profile.disponibilidadViajes
                          ? "bg-indigo-50 text-indigo-700 border-indigo-100 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 w-fit"
                          : "bg-slate-50 text-slate-600 border-slate-200 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 w-fit"
                      }
                    >
                      <Plane className="h-3 w-3" />
                      {profile.disponibilidadViajes ? "Disponible" : "No disponible"}
                    </Badge>
                  )}
                </Field>
              </Section>

              {/* Address */}
              <Section
                title="Dirección y Residencia"
                icon={<MapPin className="h-4 w-4 text-[#003087]" />}
              >
                <Field label="Dirección">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editDireccion}
                      onChange={(e) => setEditDireccion(e.target.value)}
                      placeholder="Ej: Av. Principal 123"
                      className={inputClass}
                    />
                  ) : (
                    <span>{profile.direccion || "No registrado"}</span>
                  )}
                </Field>
                <Field label="Distrito">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editDistrito}
                      onChange={(e) => setEditDistrito(e.target.value)}
                      placeholder="Ej: Piura"
                      className={inputClass}
                    />
                  ) : (
                    <span>{profile.distrito || "No registrado"}</span>
                  )}
                </Field>
                <Field label="Ciudad">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editCiudad}
                      onChange={(e) => setEditCiudad(e.target.value)}
                      placeholder="Ej: Piura"
                      className={inputClass}
                    />
                  ) : (
                    <span>{profile.ciudad || "No registrado"}</span>
                  )}
                </Field>
              </Section>

              {/* Emergency contact */}
              <Section
                title="Contacto de Emergencia"
                icon={<Phone className="h-4 w-4 text-rose-500" />}
              >
                <Field label="Nombre">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editContactoNombre}
                      onChange={(e) => setEditContactoNombre(e.target.value)}
                      placeholder="Nombre completo"
                      className={inputClass}
                    />
                  ) : (
                    <span className="font-semibold">
                      {profile.contactoEmergenciaNombre || "No registrado"}
                    </span>
                  )}
                </Field>
                <Field label="Teléfono">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editContactoTelefono}
                      onChange={(e) => setEditContactoTelefono(e.target.value)}
                      placeholder="9 dígitos"
                      maxLength={9}
                      className={inputClass}
                    />
                  ) : (
                    <span>
                      {profile.contactoEmergenciaTelefono || "No registrado"}
                    </span>
                  )}
                </Field>
              </Section>

              {/* Read-only note */}
              <p className="text-[10px] text-slate-400 text-center pb-2">
                <Briefcase className="inline w-3 h-3 mr-1 -mt-0.5" />
                El nombre, área, cargo y estado solo pueden ser modificados por un administrador.
              </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper shared styles
const inputClass =
  "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-normal text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003087] transition-colors";

const selectClass =
  "w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-xs font-normal text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003087] transition-colors";

// Section wrapper
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5 space-y-3">
      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-200/80">
        {icon}
        {title}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

// Field wrapper
function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
        {icon}
        {label}
      </label>
      <div className="text-xs text-slate-700">{children}</div>
    </div>
  );
}
