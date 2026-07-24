"use client";

import { useState, useEffect } from "react";
import { CRMHeader } from "@/components/crm/crm-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  File, 
  Download, 
  ExternalLink,
  Trash2,
  FolderOpen,
  Eye,
  Edit,
  RefreshCw
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

interface Resource {
  id: string;
  title: string;
  description: string;
  clientOrService: string;
  date: string;
  category: string;
  driveFileId: string;
  driveWebViewLink?: string;
  driveWebContentLink?: string;
  mimeType: string;
  fileName: string;
  createdAt: string;
  folderId?: string;
}

export default function BibliotecaPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [folderFilter, setFolderFilter] = useState("todos");
  
  // Modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    clientOrService: "",
    category: "foto",
    folderId: ""
  });
  const [driveFolders, setDriveFolders] = useState<{id: string, name: string}[]>([]);
  const [shareResource, setShareResource] = useState<Resource | null>(null);
  const [selectedClientForShare, setSelectedClientForShare] = useState<any>(null);
  const [customPhone, setCustomPhone] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [resourceToEdit, setResourceToEdit] = useState<Resource | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    clientOrService: "",
    category: "foto",
    folderId: ""
  });

  useEffect(() => {
    if (shareResource) {
      setCustomMessage(`Estimado(a),\n\nPor medio del presente le compartimos el siguiente recurso: *${shareResource.title}*\n\nPuede visualizarlo ingresando al siguiente enlace:\n${shareResource.driveWebViewLink}\n\nQuedamos a su entera disposición ante cualquier consulta.`);
      setCustomPhone("");
      setSelectedClientForShare(null);
      setClientSearch("");
    }
  }, [shareResource]);

  const handleClientSelect = (c: any) => {
    setSelectedClientForShare(c);
    const phone = c.telefono?.replace(/\D/g, '') || "";
    setCustomPhone(phone);
    
    const greeting = c.contacto ? `Estimado(a) ${c.contacto}, representante de ${c.empresa}` : `Estimados señores de ${c.empresa}`;
    setCustomMessage(`${greeting},\n\nPor medio del presente le compartimos el siguiente recurso: *${shareResource?.title}*\n\nPuede visualizarlo ingresando al siguiente enlace:\n${shareResource?.driveWebViewLink}\n\nQuedamos a su entera disposición ante cualquier consulta.`);
  };

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await api.get('/commercial-library');
      if (res && Array.isArray(res)) {
        setResources(res);
      }
    } catch (e) {
      console.error("Error fetching library", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const res = await api.get('/commercial-library/folders');
      if (res && Array.isArray(res)) {
        setDriveFolders(res);
      }
    } catch (e) {
      console.error("Error fetching folders", e);
    }
  };

  const fetchClientsList = async () => {
    try {
      const res = await api.get('/crm/clientes?limit=1000');
      if (res && res.data) setClients(res.data);
      else if (Array.isArray(res)) setClients(res);
    } catch(e) {
      console.error("Error fetching clients", e);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchFolders();
    fetchClientsList();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Selecciona un archivo");

    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("clientOrService", formData.clientOrService);
    data.append("category", formData.category);
    data.append("date", new Date().toISOString());
    if (formData.folderId && formData.folderId !== 'root') {
      data.append("folderId", formData.folderId);
    }

    try {
      await api.post('/commercial-library', data);
      setIsUploadModalOpen(false);
      setFile(null);
      setFormData({ title: "", description: "", clientOrService: "", category: "foto", folderId: "" });
      fetchResources();
    } catch (error) {
      console.error(error);
      alert("Error al subir archivo");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!resourceToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/commercial-library/${resourceToDelete.id}`);
      setResources(resources.filter(r => r.id !== resourceToDelete.id));
      setResourceToDelete(null);
    } catch (e) {
      console.error("Error al eliminar", e);
      alert("Error al eliminar el archivo.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (res: Resource) => {
    setResourceToEdit(res);
    setEditFormData({
      title: res.title,
      description: res.description,
      clientOrService: res.clientOrService,
      category: res.category || "general",
      folderId: res.folderId || ""
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceToEdit) return;
    try {
      await api.put(`/commercial-library/${resourceToEdit.id}`, editFormData);
      setIsEditModalOpen(false);
      fetchResources();
    } catch (e) {
      console.error(e);
      alert("Error al editar");
    }
  };

  const handleSyncDrive = async () => {
    setIsSyncing(true);
    try {
      const res = await api.post('/commercial-library/sync', {});
      alert(`Sincronización completa. Archivos nuevos agregados: ${res.added}`);
      fetchResources();
    } catch(e) {
      console.error(e);
      alert("Error al sincronizar con Drive");
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredResources = resources.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || 
                        r.clientOrService.toLowerCase().includes(search.toLowerCase()) ||
                        r.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "todos" || r.category === categoryFilter;
    const matchFolder = folderFilter === "todos" || r.folderId === folderFilter || (folderFilter === "root" && (!r.folderId || r.folderId === '12ZUJiugv84BpM-I1pMWQfu9bldqrPU67' || r.folderId === 'root'));
    return matchSearch && matchCat && matchFolder;
  });

  const filteredClients = clients.filter(c => 
    c.empresa?.toLowerCase().includes(clientSearch.toLowerCase()) || 
    c.contacto?.toLowerCase().includes(clientSearch.toLowerCase())
  ).slice(0, 50);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "video": return <Video className="w-5 h-5 text-purple-500" />;
      case "foto": return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case "brochure": return <FolderOpen className="w-5 h-5 text-amber-500" />;
      case "documento": return <FileText className="w-5 h-5 text-emerald-500" />;
      default: return <File className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <CRMHeader 
        title="Biblioteca Comercial" 
        subtitle="Repositorio central de evidencias, brochures y documentos comerciales listos para compartir con clientes." 
      />

      {/* Toolbar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-6 items-end justify-between">
        <div className="flex-1 w-full space-y-2">
          <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Búsqueda Global</Label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por título, descripción o cliente..." 
              className="pl-11 h-12 border-slate-200 bg-slate-50/50 focus:bg-white transition-all shadow-none font-medium text-sm rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 w-full space-y-2">
          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Filtro por Categoría</Label>
          <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || "")}>
            <SelectTrigger className="h-12 border-slate-200 bg-white font-black uppercase rounded-xl shadow-sm text-[11px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos" className="font-black text-[10px] uppercase">Todas las categorías</SelectItem>
              <SelectItem value="foto" className="font-black text-[10px] uppercase text-blue-600">Fotografías de Trabajos</SelectItem>
              <SelectItem value="video" className="font-black text-[10px] uppercase text-purple-600">Videos de Incidencias</SelectItem>
              <SelectItem value="brochure" className="font-black text-[10px] uppercase text-amber-600">Brochures / Catálogos</SelectItem>
              <SelectItem value="documento" className="font-black text-[10px] uppercase text-emerald-600">Documentos de Servicio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 w-full space-y-2">
          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Filtro por Carpeta</Label>
          <Select value={folderFilter} onValueChange={(val) => setFolderFilter(val || "todos")}>
            <SelectTrigger className="h-12 border-slate-200 bg-white font-black uppercase rounded-xl shadow-sm text-[11px]">
              <SelectValue placeholder="Carpeta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos" className="font-black text-[10px] uppercase">Todas las carpetas</SelectItem>
              <SelectItem value="root" className="font-black text-[10px] uppercase">Raíz (Principal)</SelectItem>
              {driveFolders.map(folder => (
                <SelectItem key={folder.id} value={folder.id} className="font-black text-[10px] uppercase text-slate-600">{folder.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3 w-full lg:w-auto">
          <Button 
            variant="outline"
            className="h-12 flex-1 lg:flex-none px-6 font-black uppercase text-[11px] border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm rounded-xl flex gap-2"
            onClick={handleSyncDrive}
            disabled={isSyncing}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> Sincronizar Drive
          </Button>

          <Button 
            className="h-12 flex-1 lg:flex-none px-6 font-black uppercase text-[11px] bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20 rounded-xl flex gap-2"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Plus className="w-4 h-4" /> Subir Evidencia
          </Button>
        </div>
      </div>

      {/* Grid de Recursos */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">No hay recursos encontrados</h3>
          <p className="text-sm text-slate-500">Sube material para que tu equipo comercial pueda compartirlo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredResources.map((res) => (
            <div key={res.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col">
              <div className="p-5 flex-1 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
                    {getCategoryIcon(res.category)}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="font-black text-[9px] uppercase border-slate-200 text-slate-500">
                      {new Date(res.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold text-slate-800 text-lg line-clamp-1">{res.title}</h3>
                  <p className="text-xs font-semibold text-accent uppercase mt-1">{res.clientOrService}</p>
                </div>
                
                <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                  {res.description}
                </p>
                
                {res.mimeType?.startsWith("video/") && (
                  <div className="mt-4 rounded-xl overflow-hidden bg-black aspect-video relative">
                    <video 
                      src={api.getFileUrl(`/commercial-library/stream/${res.id}`)}
                      controls
                      preload="none"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  </div>
                )}

                {res.mimeType?.startsWith("image/") && (
                  <div className="mt-4 rounded-xl overflow-hidden bg-slate-100 aspect-video relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={api.getFileUrl(`/commercial-library/stream/${res.id}`)}
                      alt={res.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                )}

                {!res.mimeType?.startsWith("video/") && !res.mimeType?.startsWith("image/") && res.driveWebViewLink && (
                  <div className="mt-4 rounded-xl overflow-hidden bg-slate-100 aspect-video relative border border-slate-200">
                    <iframe
                      src={res.driveWebViewLink.replace(/\/view.*/, '/preview')}
                      className="absolute inset-0 w-full h-full border-0"
                      title={res.title}
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex justify-between items-center">
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                    onClick={() => handleEditClick(res)}
                    title="Editar recurso"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    onClick={() => setResourceToDelete(res)}
                    title="Eliminar recurso"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  {res.driveWebContentLink && (
                    <a href={res.driveWebContentLink} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="h-9 gap-2 font-black text-[10px] uppercase border-slate-200">
                        <Download className="w-3.5 h-3.5" /> Descargar
                      </Button>
                    </a>
                  )}
                  {res.driveWebViewLink && (
                    <Button 
                      size="sm" 
                      className="h-9 gap-2 font-black text-[10px] uppercase bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
                      onClick={() => setShareResource(res)}
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Compartir
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={!!resourceToDelete} onOpenChange={(open) => !open && !isDeleting && setResourceToDelete(null)}>
        <DialogContent className="max-w-sm bg-white rounded-2xl border-none shadow-2xl p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="w-8 h-8 text-red-500" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800 text-center uppercase">¿Estás Seguro?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-500 font-medium mt-2">
              Vas a eliminar <strong>{resourceToDelete?.title}</strong>.<br/><br/>
              Esta acción borrará el archivo de tu sistema y también lo eliminará permanentemente de tu Google Drive. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button 
                variant="outline" 
                className="flex-1 h-11 rounded-xl font-bold border-slate-200 hover:bg-slate-50 text-slate-600"
                onClick={() => setResourceToDelete(null)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                className="flex-1 h-11 rounded-xl font-black uppercase shadow-lg shadow-red-500/20 text-[11px] bg-red-500 hover:bg-red-600"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Sí, Eliminar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
          <DialogHeader className="p-6 bg-primary text-white">
            <DialogTitle className="text-2xl font-black uppercase flex items-center gap-3">
              <Plus className="w-6 h-6 text-accent" />
              Nuevo Recurso Comercial
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Título del Recurso</Label>
                <Input 
                  required
                  placeholder="Ej: Mantenimiento Preventivo Subestación"
                  className="h-11 rounded-xl"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Categoría</Label>
                <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v || "foto"})}>
                  <SelectTrigger className="h-11 rounded-xl font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="foto">Fotografía</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="brochure">Brochure</SelectItem>
                    <SelectItem value="documento">Documento / Informe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Carpeta Destino en Drive (Opcional)</Label>
              <Select value={formData.folderId} onValueChange={v => setFormData({...formData, folderId: v || ""})}>
                <SelectTrigger className="h-11 rounded-xl font-medium">
                  <SelectValue placeholder="Raíz (Principal)">
                    {formData.folderId 
                      ? driveFolders.find(f => f.id === formData.folderId)?.name || formData.folderId 
                      : "Raíz (Principal)"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Raíz (Principal)</SelectItem>
                  {driveFolders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Cliente o Tipo de Servicio Relacionado</Label>
              <Input 
                required
                placeholder="Ej: Minera Las Bambas / Cambio de Celdas"
                className="h-11 rounded-xl"
                value={formData.clientOrService}
                onChange={e => setFormData({...formData, clientOrService: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Descripción / Contexto para el cliente</Label>
              <Textarea 
                required
                placeholder="Describe brevemente de qué trata este recurso..."
                className="min-h-[100px] rounded-xl resize-none"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Archivo Multimedia (Se subirá a Google Drive de forma automática)</Label>
              <Input 
                type="file" 
                required
                onChange={handleFileChange}
                className="h-12 pt-3 rounded-xl file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsUploadModalOpen(false)}
                className="h-11 px-6 rounded-xl font-bold"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={uploading}
                className="h-11 px-8 rounded-xl font-black uppercase text-xs bg-accent hover:bg-accent/90 shadow-lg shadow-accent/30"
              >
                {uploading ? "Subiendo a Drive..." : "Guardar Recurso"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
          <DialogHeader className="p-6 bg-primary text-white">
            <DialogTitle className="text-2xl font-black uppercase flex items-center gap-3">
              <Edit className="w-6 h-6 text-accent" />
              Editar Recurso
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Título del Recurso</Label>
                <Input 
                  required
                  placeholder="Ej: Mantenimiento Preventivo Subestación"
                  className="h-11 rounded-xl"
                  value={editFormData.title}
                  onChange={e => setEditFormData({...editFormData, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Categoría</Label>
                <Select value={editFormData.category} onValueChange={v => setEditFormData({...editFormData, category: v || "foto"})}>
                  <SelectTrigger className="h-11 rounded-xl font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="foto">Fotografía</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="brochure">Brochure</SelectItem>
                    <SelectItem value="documento">Documento / Informe</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Carpeta en Drive</Label>
              <Select value={editFormData.folderId || "root"} onValueChange={(v) => setEditFormData({...editFormData, folderId: v === "root" || !v ? "" : v})}>
                <SelectTrigger className="h-11 rounded-xl font-medium">
                  <SelectValue placeholder="Raíz (Principal)">
                    {editFormData.folderId 
                      ? driveFolders.find(f => f.id === editFormData.folderId)?.name || "Raíz (Principal)"
                      : "Raíz (Principal)"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Raíz (Principal)</SelectItem>
                  {driveFolders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Cliente o Tipo de Servicio Relacionado</Label>
              <Input 
                required
                placeholder="Ej: Minera Las Bambas / Cambio de Celdas"
                className="h-11 rounded-xl"
                value={editFormData.clientOrService}
                onChange={e => setEditFormData({...editFormData, clientOrService: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Descripción / Contexto para el cliente</Label>
              <Textarea 
                required
                placeholder="Describe brevemente de qué trata este recurso..."
                className="min-h-[100px] rounded-xl resize-none"
                value={editFormData.description}
                onChange={e => setEditFormData({...editFormData, description: e.target.value})}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditModalOpen(false)}
                className="h-11 px-6 rounded-xl font-bold"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="h-11 px-8 rounded-xl font-black uppercase text-xs bg-accent hover:bg-accent/90 shadow-lg shadow-accent/30"
              >
                Guardar Cambios
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={!!shareResource} onOpenChange={(open) => {
        if (!open) {
          setShareResource(null);
        }
      }}>
        <DialogContent className="max-w-3xl bg-white rounded-2xl border-none shadow-2xl p-8">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl font-black uppercase text-primary flex items-center gap-3">
              <span className="bg-[#25D366]/10 p-2 rounded-xl">
                <ExternalLink className="w-6 h-6 text-[#25D366]" />
              </span>
              Compartir por WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            
            {/* Columna Izquierda: Buscador */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">1. Buscar en Cartera (Opcional)</Label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Escribe la empresa o contacto..." 
                    className="pl-11 h-12 border-slate-200 bg-slate-50/50 focus:bg-white transition-all shadow-none font-medium text-sm rounded-xl"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                  />
                </div>
              </div>

              {clientSearch && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="text-[10px] font-black uppercase text-accent tracking-widest">
                    {filteredClients.length === 50 ? "+50" : filteredClients.length} Resultados encontrados
                  </Label>
                  <div className="max-h-[300px] overflow-y-auto space-y-1.5 bg-slate-50 rounded-xl p-2 border border-slate-100 custom-scrollbar">
                    {filteredClients.length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-500 font-medium">No se encontraron clientes que coincidan.</div>
                    ) : (
                      <>
                        {filteredClients.map(c => (
                          <div 
                            key={c.id} 
                            onClick={() => handleClientSelect(c)}
                            className={`p-4 rounded-xl cursor-pointer transition-all border ${
                              selectedClientForShare?.id === c.id 
                                ? 'bg-primary/5 border-primary shadow-sm' 
                                : 'bg-white border-transparent hover:border-slate-200 hover:shadow-sm'
                            }`}
                          >
                            <div className={`font-bold text-sm ${selectedClientForShare?.id === c.id ? 'text-primary' : 'text-slate-700'}`}>
                              {c.empresa}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 flex flex-col gap-0.5">
                              {c.contacto && <span>👤 {c.contacto}</span>}
                              <span>📱 {c.telefono || 'Sin teléfono registrado'}</span>
                            </div>
                          </div>
                        ))}
                        {clients.filter(c => 
                          c.empresa?.toLowerCase().includes(clientSearch.toLowerCase()) || 
                          c.contacto?.toLowerCase().includes(clientSearch.toLowerCase())
                        ).length > 50 && (
                          <div className="p-3 text-center text-xs text-slate-400 font-bold bg-slate-100 rounded-lg mt-2">
                            Continúa escribiendo para ser más específico...
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {!clientSearch && !selectedClientForShare && (
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 text-center flex flex-col items-center justify-center h-40">
                  <Search className="w-8 h-8 text-slate-300 mb-3" />
                  <p className="text-xs text-slate-500 font-medium">Usa el buscador superior para encontrar rápidamente a tu cliente y autocompletar sus datos.</p>
                </div>
              )}
            </div>

            {/* Columna Derecha: Configuración de envío */}
            <div className="space-y-6 flex flex-col h-full">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">2. Número de WhatsApp</Label>
                <Input 
                  placeholder="Ej: 51999888777" 
                  value={customPhone} 
                  onChange={e => setCustomPhone(e.target.value)} 
                  className="h-12 border-slate-200 font-bold text-sm rounded-xl focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-2 flex-1 flex flex-col">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">3. Mensaje a Enviar</Label>
                <Textarea 
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  className="flex-1 min-h-[160px] rounded-xl resize-none text-sm border-slate-200 focus:border-primary transition-all leading-relaxed p-4"
                />
              </div>

              <Button 
                className="w-full h-14 gap-3 font-black uppercase text-sm bg-[#25D366] hover:bg-[#1ebd5a] text-white rounded-xl shadow-xl shadow-[#25D366]/20 transition-all disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5"
                disabled={!customPhone || !customMessage}
                onClick={() => {
                  const phone = customPhone.replace(/\D/g, '');
                  if (!phone) return alert("Ingresa un número válido para enviar el mensaje.");
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(customMessage)}`, '_blank');
                  setShareResource(null);
                }}
              >
                Enviar por WhatsApp
              </Button>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
