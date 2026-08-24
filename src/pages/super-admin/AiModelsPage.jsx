import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bot, ImagePlus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePageTitle } from '@/context/PageTitleContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { FormSelect } from '@/components/ui/SelectMenu';
import { resolveAssetUrl } from '@/lib/assetUrl';
import {
  clearSupportedLlmError,
  createSupportedLlm,
  deleteSupportedLlm,
  fetchAdminSupportedLlms,
  replaceSupportedLlmIcon,
  selectSupportedLlms,
  updateSupportedLlm,
} from '@/store/slices/supportedLlmSlice';

const SLOT_OPTIONS = [
  { value: 'PRIMARY', label: 'Primary' },
  { value: 'BACKUP', label: 'Backup' },
  { value: 'BOTH', label: 'Both' },
];

const emptyForm = {
  modelName: '',
  displayName: '',
  provider: '',
  slot: 'PRIMARY',
  sortOrder: 0,
  isActive: true,
};

export function AiModelsPage() {
  usePageTitle('AI Models');
  const dispatch = useDispatch();
  const { adminItems, loading, saving, error } = useSelector(selectSupportedLlms);
  const fileInputRef = useRef(null);
  const replaceInputRef = useRef(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [replaceTargetId, setReplaceTargetId] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminSupportedLlms());
  }, [dispatch]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const openCreate = () => {
    dispatch(clearSupportedLlmError());
    setEditingId(null);
    setForm(emptyForm);
    setIconFile(null);
    setIconPreview(null);
    setFormOpen(true);
  };

  const openEdit = (item) => {
    dispatch(clearSupportedLlmError());
    setEditingId(item.supportedLlmId);
    setForm({
      modelName: item.modelName,
      displayName: item.displayName,
      provider: item.provider || '',
      slot: item.slot,
      sortOrder: item.sortOrder ?? 0,
      isActive: item.isActive !== false,
    });
    setIconFile(null);
    setIconPreview(resolveAssetUrl(item.iconUrl));
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditingId(null);
    setIconFile(null);
    setIconPreview(null);
  };

  const onPickIcon = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.modelName.trim() || !form.displayName.trim()) {
      toast.error('Model name and display name are required');
      return;
    }
    if (!editingId && !iconFile) {
      toast.error('Icon image is required');
      return;
    }

    if (editingId) {
      const result = await dispatch(
        updateSupportedLlm({
          supportedLlmId: editingId,
          payload: {
            modelName: form.modelName.trim(),
            displayName: form.displayName.trim(),
            provider: form.provider.trim() || null,
            slot: form.slot,
            sortOrder: Number(form.sortOrder) || 0,
            isActive: Boolean(form.isActive),
          },
        })
      );
      if (updateSupportedLlm.fulfilled.match(result)) {
        if (iconFile) {
          const iconResult = await dispatch(
            replaceSupportedLlmIcon({ supportedLlmId: editingId, file: iconFile })
          );
          if (replaceSupportedLlmIcon.rejected.match(iconResult)) {
            toast.error(iconResult.payload || 'Failed to update icon');
            return;
          }
        }
        toast.success('AI model updated');
        closeForm();
      }
      return;
    }

    const formData = new FormData();
    formData.append('modelName', form.modelName.trim());
    formData.append('displayName', form.displayName.trim());
    if (form.provider.trim()) formData.append('provider', form.provider.trim());
    formData.append('slot', form.slot);
    formData.append('sortOrder', String(Number(form.sortOrder) || 0));
    formData.append('isActive', String(Boolean(form.isActive)));
    formData.append('file', iconFile);

    const result = await dispatch(createSupportedLlm(formData));
    if (createSupportedLlm.fulfilled.match(result)) {
      toast.success('AI model created');
      closeForm();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteSupportedLlm(deleteTarget.supportedLlmId));
    if (deleteSupportedLlm.fulfilled.match(result)) {
      toast.success('AI model deleted');
      setDeleteTarget(null);
    }
  };

  const onReplaceIconClick = (supportedLlmId) => {
    setReplaceTargetId(supportedLlmId);
    replaceInputRef.current?.click();
  };

  const onReplaceIconChange = async (event) => {
    const file = event.target.files?.[0];
    const id = replaceTargetId;
    event.target.value = '';
    setReplaceTargetId(null);
    if (!file || !id) return;

    const result = await dispatch(replaceSupportedLlmIcon({ supportedLlmId: id, file }));
    if (replaceSupportedLlmIcon.fulfilled.match(result)) {
      toast.success('Icon updated');
    } else {
      toast.error(result.payload || 'Failed to update icon');
    }
  };

  return (
    <div className="mx-auto w-full max-w-8xl space-y-6">
      <PageHeader
        title="AI Models"
        subtitle="Manage the platform LLM catalog used in organization AI preferences."
        actionLabel={
          <>
            <Bot className="mr-2 h-4 w-4" />
            Add model
          </>
        }
        onAction={openCreate}
      />

      <input
        ref={replaceInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onReplaceIconChange}
      />

      <Card>
        <CardContent className="p-0">
          {loading && adminItems.length === 0 ? (
            <p className="p-6 text-sm text-muted">Loading AI models…</p>
          ) : adminItems.length === 0 ? (
            <p className="p-6 text-sm text-muted">No AI models yet. Add the first model.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Model</th>
                    <th className="px-4 py-3 font-medium">Provider</th>
                    <th className="px-4 py-3 font-medium">Slot</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminItems.map((item) => (
                    <tr key={item.supportedLlmId} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={resolveAssetUrl(item.iconUrl)}
                            alt=""
                            className="h-9 w-9 rounded-lg border border-border object-cover"
                          />
                          <div>
                            <p className="font-medium text-foreground">{item.displayName}</p>
                            <p className="text-xs text-muted">{item.modelName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{item.provider || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant="default">
                          {SLOT_OPTIONS.find((s) => s.value === item.slot)?.label || item.slot}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={item.isActive ? 'success' : 'warning'}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onReplaceIconClick(item.supportedLlmId)}
                            aria-label="Replace icon"
                          >
                            <ImagePlus className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(item)}
                            aria-label="Edit model"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(item)}
                            aria-label="Delete model"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={formOpen}
        title={editingId ? 'Edit AI model' : 'Add AI model'}
        description={
          editingId
            ? 'Update catalog metadata. Upload a new image to replace the icon.'
            : 'Create a catalog entry. An icon image is required (PNG, JPEG, or WebP).'
        }
        confirmLabel={editingId ? 'Save changes' : 'Create model'}
        loading={saving}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
        onCancel={closeForm}
        onConfirm={handleSubmit}
      >
        <div className="mt-4 space-y-3">
          <div>
            <Label>Display name</Label>
            <Input
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              placeholder="GPT-4o mini"
            />
          </div>
          <div>
            <Label>Model name</Label>
            <Input
              value={form.modelName}
              onChange={(e) => setForm((f) => ({ ...f, modelName: e.target.value }))}
              placeholder="gpt-4o-mini"
            />
          </div>
          <div>
            <Label>Provider (optional)</Label>
            <Input
              value={form.provider}
              onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
              placeholder="OpenAI"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Slot</Label>
              <FormSelect
                value={form.slot}
                onValueChange={(value) => setForm((f) => ({ ...f, slot: value }))}
                options={SLOT_OPTIONS}
              />
            </div>
            <div>
              <Label>Sort order</Label>
              <Input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Active (visible in org dropdowns)
          </label>
          <div>
            <Label>{editingId ? 'Icon (optional replace)' : 'Icon (required)'}</Label>
            <div className="mt-2 flex items-center gap-3">
              {iconPreview ? (
                <img
                  src={iconPreview}
                  alt=""
                  className="h-12 w-12 rounded-lg border border-border object-cover"
                />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-border text-muted">
                  <ImagePlus className="h-5 w-5" />
                </span>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                {editingId ? 'Choose new image' : 'Choose image'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={onPickIcon}
              />
            </div>
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete AI model?"
        description={
          deleteTarget
            ? `"${deleteTarget.displayName}" will be soft-deleted and hidden from organization dropdowns.`
            : undefined
        }
        confirmLabel="Delete"
        variant="danger"
        loading={saving}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
