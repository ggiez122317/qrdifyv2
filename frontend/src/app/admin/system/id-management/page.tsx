'use client';

/* eslint-disable @next/next/no-img-element */
import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Image as ImageIcon, Images, LayoutTemplate, Loader2, RotateCcw, Save, Trash2, Upload } from 'lucide-react';
import api from '@/lib/axios';
import { getImageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type TemplateSide = 'front' | 'back';

interface IdTemplates {
  mode: 'default' | 'custom';
  front_template: string;
  back_template: string;
}

const emptyTemplates: IdTemplates = {
  mode: 'default',
  front_template: '',
  back_template: '',
};

const acceptedTypes = ['image/png', 'image/jpeg', 'image/webp'];
const maxFileSize = 5 * 1024 * 1024;

function templateKey(side: TemplateSide): keyof IdTemplates {
  return `${side}_template`;
}

function TemplatePanel({
  side,
  activePath,
  file,
  onSelect,
  onRemove,
  isRemoving,
  isCustomMode,
}: {
  side: TemplateSide;
  activePath: string;
  file: File | null;
  onSelect: (side: TemplateSide, file: File) => void;
  onRemove: (side: TemplateSide) => void;
  isRemoving: boolean;
  isCustomMode: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const localPreview = useMemo(() => file ? URL.createObjectURL(file) : '', [file]);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const preview = localPreview || getImageUrl(activePath);
  const title = side === 'front' ? 'Front base' : 'Back base';
  const inputId = `${side}-template-upload`;

  const acceptFile = (selected?: File) => {
    if (selected) onSelect(side, selected);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  return (
    <article className="border border-slate-200 bg-white">
      <div className="flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">Background artwork only</p>
        </div>
        <span className={`border px-2.5 py-1 text-xs font-semibold ${file ? 'border-amber-200 bg-amber-50 text-amber-700' : activePath ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
          {file ? 'Pending save' : activePath ? isCustomMode ? 'Custom active' : 'Custom saved' : 'Built-in active'}
        </span>
      </div>

      <div className="grid gap-6 p-5 sm:grid-cols-[180px_minmax(0,1fr)]">
        <div className="mx-auto w-[180px]">
          <div className="relative aspect-[260/414] overflow-hidden border border-slate-300 bg-[#f8fafc] shadow-[0_8px_24px_rgba(15,23,42,0.10)]">
            {preview ? (
              <img src={preview} alt={`${title} preview`} className="h-full w-full object-fill" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-5 text-center">
                <ImageIcon className="h-7 w-7 text-slate-300" aria-hidden="true" />
                <p className="mt-3 text-xs font-semibold text-slate-500">Built-in ID design</p>
                <p className="mt-1 text-[11px] leading-4 text-slate-400">Upload a base to replace the default background artwork.</p>
              </div>
            )}
          </div>
          <p className="mt-3 text-center text-xs font-medium text-slate-500">Portrait · 260:414 ratio</p>
        </div>

        <div className="flex min-w-0 flex-col justify-center">
          <label
            htmlFor={inputId}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={event => event.preventDefault()}
            onDrop={handleDrop}
            className={`flex min-h-40 cursor-pointer flex-col items-center justify-center border-2 border-dashed px-5 py-6 text-center transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-[#0B3A82] focus-within:ring-offset-2 ${isDragging ? 'border-[#0B3A82] bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-[#0B3A82] hover:bg-blue-50/50'}`}
          >
            <span className="flex h-10 w-10 items-center justify-center border border-slate-200 bg-white text-[#0B3A82]">
              <Upload className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="mt-3 text-sm font-bold text-slate-800">{file || activePath ? 'Choose a replacement' : `Upload ${side} base`}</span>
            <span className="mt-1 max-w-64 text-xs leading-5 text-slate-500">Drop an image here or browse your device. PNG, JPG, or WEBP up to 5 MB.</span>
            <input
              id={inputId}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event: ChangeEvent<HTMLInputElement>) => acceptFile(event.target.files?.[0])}
            />
          </label>

          {file && (
            <div className="mt-3 flex items-center justify-between gap-3 border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs">
              <span className="min-w-0 truncate font-semibold text-amber-800">{file.name}</span>
              <span className="shrink-0 text-amber-700">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          )}

          {activePath && !file && (
            <div className="mt-4">
              {confirmRemove ? (
                <div className="border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-semibold text-red-800">Restore the built-in {side} design?</p>
                  <div className="mt-3 flex gap-2">
                    <Button type="button" onClick={() => onRemove(side)} disabled={isRemoving} className="h-9 bg-red-700 px-3 text-xs font-bold text-white hover:bg-red-800">
                      {isRemoving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1.5 h-3.5 w-3.5" />}
                      Remove
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setConfirmRemove(false)} disabled={isRemoving} className="h-9 px-3 text-xs font-bold">Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button type="button" variant="outline" onClick={() => setConfirmRemove(true)} className="h-10 border-slate-300 px-4 text-sm font-bold text-slate-700">
                  <RotateCcw className="mr-2 h-4 w-4" /> Restore built-in design
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function IdManagementPage() {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<Record<TemplateSide, File | null>>({ front: null, back: null });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingMode, setIsChangingMode] = useState(false);
  const [removingSide, setRemovingSide] = useState<TemplateSide | null>(null);

  const { data: templates = emptyTemplates, isLoading } = useQuery<IdTemplates>({
    queryKey: ['id-templates'],
    queryFn: async () => (await api.get('/api/system/id-templates')).data,
  });

  const selectFile = (side: TemplateSide, file: File) => {
    setError(null);
    setMessage(null);

    if (!acceptedTypes.includes(file.type)) {
      setError('Use a PNG, JPG, or WEBP image.');
      return;
    }
    if (file.size > maxFileSize) {
      setError('Each template must be 5 MB or smaller.');
      return;
    }

    setFiles(current => ({ ...current, [side]: file }));
  };

  const saveTemplates = async () => {
    if (!files.front && !files.back) {
      setError('Choose a front or back template before saving.');
      return;
    }

    const formData = new FormData();
    if (files.front) formData.append('front_template', files.front);
    if (files.back) formData.append('back_template', files.back);

    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await api.post('/api/system/id-templates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.setQueryData(['id-templates'], response.data.templates);
      queryClient.invalidateQueries({ queryKey: ['system-preferences'] });
      setFiles({ front: null, back: null });
      setMessage(templates.mode === 'custom'
        ? 'Student ID base templates saved and applied.'
        : 'Student ID base templates saved. Select Custom templates when you are ready to apply them.');
    } catch (requestError: unknown) {
      const validationErrors = typeof requestError === 'object' && requestError !== null && 'errors' in requestError
        ? (requestError as { errors?: Record<string, string[]> }).errors
        : undefined;
      setError(validationErrors ? Object.values(validationErrors).flat().join(' ') : requestError instanceof Error ? requestError.message : 'Unable to save ID templates.');
    } finally {
      setIsSaving(false);
    }
  };

  const removeTemplate = async (side: TemplateSide) => {
    setRemovingSide(side);
    setError(null);
    setMessage(null);
    try {
      const response = await api.delete(`/api/system/id-templates/${side}`);
      queryClient.setQueryData(['id-templates'], response.data.templates);
      queryClient.invalidateQueries({ queryKey: ['system-preferences'] });
      setMessage(response.data.message);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to remove the template.');
    } finally {
      setRemovingSide(null);
    }
  };

  const setDesignMode = async (mode: IdTemplates['mode']) => {
    if (mode === templates.mode) return;

    setIsChangingMode(true);
    setError(null);
    setMessage(null);
    try {
      const response = await api.patch('/api/system/id-templates/mode', { mode });
      queryClient.setQueryData(['id-templates'], response.data.templates);
      queryClient.invalidateQueries({ queryKey: ['system-preferences'] });
      setMessage(response.data.message);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to change the active ID design.');
    } finally {
      setIsChangingMode(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-[1180px]">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B3A82]">System</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">ID Management</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Upload the background artwork for student IDs. Student details, photos, school logos, QR codes, and signatures remain dynamic and are not part of these files.</p>
          </div>
          <Button type="button" onClick={saveTemplates} disabled={isSaving || (!files.front && !files.back)} className="h-11 w-full bg-[#0B3A82] px-5 font-bold text-white hover:bg-[#082e68] sm:w-auto">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Saving templates…' : 'Save templates'}
          </Button>
        </header>

        <section className="mt-6 border border-blue-200 bg-blue-50 px-4 py-4 sm:px-5" aria-label="Template requirements">
          <div className="flex items-start gap-3">
            <ImageIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#0B3A82]" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Prepare background-only artwork</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600">Use a portrait image with a 260:414 ratio and at least 260 × 414 pixels. Do not include names, photos, logos, QR codes, signatures, school year, or contact details.</p>
            </div>
          </div>
        </section>

        {!isLoading && (
          <section className="mt-6 border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="active-design-heading">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 id="active-design-heading" className="text-base font-bold text-slate-900">Active student ID design</h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">Switch designs without deleting your uploaded templates.</p>
              </div>
              <div role="group" aria-label="Choose active student ID design" className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto">
                <button
                  type="button"
                  aria-pressed={templates.mode === 'default'}
                  disabled={isChangingMode}
                  onClick={() => setDesignMode('default')}
                  className={`flex min-h-14 items-center gap-3 border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B3A82] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${templates.mode === 'default' ? 'border-[#0B3A82] bg-blue-50 text-[#0B3A82]' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'}`}
                >
                  <LayoutTemplate className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span><span className="block text-sm font-bold">Default design</span><span className="mt-0.5 block text-xs font-medium opacity-75">Current built-in ID</span></span>
                  {templates.mode === 'default' && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0" aria-hidden="true" />}
                </button>
                <button
                  type="button"
                  aria-pressed={templates.mode === 'custom'}
                  disabled={isChangingMode || (!templates.front_template && !templates.back_template)}
                  onClick={() => setDesignMode('custom')}
                  className={`flex min-h-14 items-center gap-3 border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B3A82] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${templates.mode === 'custom' ? 'border-[#0B3A82] bg-blue-50 text-[#0B3A82]' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'}`}
                >
                  {isChangingMode ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden="true" /> : <Images className="h-5 w-5 shrink-0" aria-hidden="true" />}
                  <span><span className="block text-sm font-bold">Custom templates</span><span className="mt-0.5 block text-xs font-medium opacity-75">Uploaded background files</span></span>
                  {templates.mode === 'custom' && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0" aria-hidden="true" />}
                </button>
              </div>
            </div>
          </section>
        )}

        {message && <div role="status" className="mt-5 flex items-start gap-2 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{message}</div>}
        {error && <div role="alert" className="mt-5 flex items-start gap-2 border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

        {isLoading ? (
          <div className="mt-6 flex min-h-80 items-center justify-center border border-slate-200 bg-white text-sm font-semibold text-slate-500" aria-busy="true">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading ID templates…
          </div>
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            {(['front', 'back'] as TemplateSide[]).map(side => (
              <TemplatePanel
                key={side}
                side={side}
                activePath={templates[templateKey(side)]}
                file={files[side]}
                onSelect={selectFile}
                onRemove={removeTemplate}
                isRemoving={removingSide === side}
                isCustomMode={templates.mode === 'custom'}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
