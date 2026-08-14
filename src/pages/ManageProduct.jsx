import { useMemo, useRef, useState } from 'react'
import {
  Plus, Pencil, Trash2, Upload, X, Link2, PackageSearch, Building2, User2, ImagePlus,
  AlertTriangle, ZoomIn, MoveHorizontal, MoveVertical, RotateCcw, Lock, Wrench, Beef,
} from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Modal from '../components/Modal.jsx'
import ProductCard from '../components/ProductCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useApp } from '../store/AppContext.jsx'
import { useToast } from '../store/ToastContext.jsx'
import { ANIMAL_TYPES, MAX_IMAGES, DETAILS_MAX } from '../data/constants.js'
import { convertFromPKR, formatMoney } from '../lib/currency.js'
import { fileToScaledDataURL, normalizeImage, imageUrl, imageStyle } from '../lib/images.js'

const TABS = [
  { kind: 'livestock', label: 'Animal Profile', addLabel: 'Add Animal', icon: Beef },
  { kind: 'equipment', label: 'Equipment', addLabel: 'Add Equipment', icon: Wrench },
]

const blankAnimal = () => ({
  kind: 'livestock',
  images: [],
  name: '',
  details: '',
  breed: '',
  age: '',
  weight: '',
  type: 'Cow',
  valuePKR: '',
  owner: { ownedByFarm: true, firstName: '', lastName: '', cnic: '', phone: '', email: '' },
})

const blankEquipment = () => ({
  kind: 'equipment',
  images: [],
  name: '',
  details: '',
  warranty: '',
  lifeSpan: '',
  valuePKR: '',
})

export default function ManageProduct() {
  const { livestock, equipment, settings, addProduct, updateProduct, deleteProduct, statusOf, hasOpenSponsorships } = useApp()
  const { toast } = useToast()
  const [tab, setTab] = useState('livestock')
  const [editor, setEditor] = useState({ open: false, id: null })
  const [confirmDelete, setConfirmDelete] = useState(null)

  const list = tab === 'equipment' ? equipment : livestock
  const active = useMemo(() => TABS.find((t) => t.kind === tab), [tab])
  const editing = editor.id ? list.find((p) => p.id === editor.id) : null

  const doDelete = async () => {
    if (!confirmDelete) return
    try {
      await deleteProduct(confirmDelete.id)
      toast(`${confirmDelete.name} was deleted.`, { type: 'info' })
    } catch (e) {
      toast(e.message, { type: 'error', duration: 6000 })
    }
    setConfirmDelete(null)
  }

  return (
    <>
      <PageHeader
        hideBack
        eyebrow="Manage products"
        title="Live stock &amp; equipment"
        subtitle="Create, edit, and remove everything shown across the site. Photos use a fixed portrait frame you can fine-tune per image."
        actions={
          <button onClick={() => setEditor({ open: true, id: null })} className="btn-primary btn-md">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {active.addLabel}
          </button>
        }
      />

      <div className="container-x py-8 sm:py-12">
        <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Product type">
          {TABS.map((t) => (
            <button
              key={t.kind}
              role="tab"
              aria-selected={tab === t.kind}
              onClick={() => setTab(t.kind)}
              className={`chip cursor-pointer px-4 py-2.5 text-sm transition-colors ${
                tab === t.kind
                  ? 'bg-brand-500 text-white'
                  : 'border border-brand-200 bg-white text-ink/70 hover:bg-brand-50'
              }`}
            >
              <t.icon className="h-4 w-4" aria-hidden="true" />
              {t.label}
              <span className={tab === t.kind ? 'text-white/70' : 'text-ink/40'}>
                {t.kind === 'equipment' ? equipment.length : livestock.length}
              </span>
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title={tab === 'equipment' ? 'No equipment yet' : 'No animals yet'}
            description={
              tab === 'equipment'
                ? 'Add your first piece of equipment so sponsors can support the tools behind the herd.'
                : 'Add your first animal profile to populate the herd and sponsorship pages.'
            }
            action={
              <button onClick={() => setEditor({ open: true, id: null })} className="btn-primary btn-md">
                <Plus className="h-4 w-4" aria-hidden="true" />
                {active.addLabel}
              </button>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => {
              const locked = hasOpenSponsorships(p.id)
              return (
                <ProductCard
                  key={p.id}
                  product={p}
                  showOwner={p.kind !== 'equipment'}
                  footer={
                    <div className="space-y-3">
                      <StatusBadge status={statusOf(p.id)} />
                      {/* Both branches reserve the same height so cards stay uniform. */}
                      <div className="flex min-h-[42px] items-center">
                        {locked ? (
                          <p className="flex items-start gap-1.5 rounded-xl bg-gold-50 px-3 py-2 text-[11px] leading-snug text-gold-800">
                            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            Open sponsorships — settle them in Confirmations to edit or delete this.
                          </p>
                        ) : (
                          <div className="grid w-full grid-cols-2 gap-2">
                            <button onClick={() => setEditor({ open: true, id: p.id })} className="btn-outline btn-sm !px-2">
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                              Edit
                            </button>
                            <button
                              onClick={() => setConfirmDelete(p)}
                              className="btn-sm btn border border-red-200 bg-white !px-2 text-red-600 hover:bg-red-50 focus-visible:ring-red-400"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  }
                />
              )
            })}
          </div>
        )}
      </div>

      {editor.open && (
        <ProductEditor
          key={editor.id || `new-${tab}`}
          kind={tab}
          product={editing}
          collectOwnerInfo={settings.collectOwnerInfo}
          fxRates={settings.fxRates}
          onClose={() => setEditor({ open: false, id: null })}
          onSave={async (data) => {
            try {
              if (editor.id) {
                await updateProduct(editor.id, data)
                toast(`${data.name} was updated.`)
              } else {
                await addProduct(data)
                toast(`${data.name} was added.`)
              }
              setEditor({ open: false, id: null })
            } catch (e) {
              toast(e.message, { type: 'error', duration: 6000 })
            }
          }}
        />
      )}

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title={confirmDelete?.kind === 'equipment' ? 'Delete equipment' : 'Delete animal'}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirmDelete(null)} className="btn-ghost btn-md">
              Keep it
            </button>
            <button
              onClick={doDelete}
              className="btn-md btn bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <p className="text-ink/75">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-ink">{confirmDelete?.name}</span>? This removes the
            profile entirely. This can’t be undone.
          </p>
        </div>
      </Modal>
    </>
  )
}

function ProductEditor({ kind, product, collectOwnerInfo, fxRates, onClose, onSave }) {
  const isEquipment = (product?.kind || kind) === 'equipment'
  const [form, setForm] = useState(() => {
    if (!product) return isEquipment ? blankEquipment() : blankAnimal()
    const base = {
      kind: product.kind,
      images: (product.images || []).map(normalizeImage),
      name: product.name || '',
      details: product.details || '',
      valuePKR: product.valuePKR != null ? String(product.valuePKR) : '',
    }
    return isEquipment
      ? { ...base, warranty: product.warranty || '', lifeSpan: product.lifeSpan || '' }
      : {
          ...base,
          breed: product.breed || '',
          age: product.age || '',
          weight: product.weight || '',
          type: product.type || 'Cow',
          owner: {
            ownedByFarm: product.owner?.ownedByFarm ?? true,
            firstName: product.owner?.firstName || '',
            lastName: product.owner?.lastName || '',
            cnic: product.owner?.cnic || '',
            phone: product.owner?.phone || '',
            email: product.owner?.email || '',
          },
        }
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }
  const setOwner = (key, value) => setForm((f) => ({ ...f, owner: { ...f.owner, [key]: value } }))
  const setImages = (images) => {
    setForm((f) => ({ ...f, images }))
    if (errors.images) setErrors((e) => ({ ...e, images: undefined }))
  }

  const conv = convertFromPKR(Number(form.valuePKR) || 0, fxRates)

  const submit = (ev) => {
    ev.preventDefault()
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required.'
    if (form.images.length === 0) e.images = 'Add at least one photo.'
    if (!form.valuePKR || Number(form.valuePKR) <= 0) e.valuePKR = 'Enter a sponsorship value in PKR.'
    const needsOwner = !isEquipment && collectOwnerInfo && !form.owner.ownedByFarm
    if (needsOwner && !form.owner.firstName.trim()) e.ownerFirst = 'Owner first name is required.'
    if (needsOwner && !form.owner.lastName.trim()) e.ownerLast = 'Owner last name is required.'
    setErrors(e)
    if (Object.keys(e).length) return

    const common = {
      kind: isEquipment ? 'equipment' : 'livestock',
      images: form.images.map(normalizeImage),
      name: form.name.trim(),
      details: form.details.trim().slice(0, DETAILS_MAX),
      valuePKR: Math.round(Number(form.valuePKR)),
    }

    if (isEquipment) {
      onSave({ ...common, warranty: form.warranty.trim(), lifeSpan: form.lifeSpan.trim() })
      return
    }

    const owner = collectOwnerInfo && !form.owner.ownedByFarm
      ? { ...form.owner, ownedByFarm: false }
      : { ownedByFarm: true, firstName: '', lastName: '', cnic: '', phone: '', email: '' }

    onSave({
      ...common,
      breed: form.breed.trim(),
      age: form.age.trim(),
      weight: form.weight.trim(),
      type: form.type,
      owner,
    })
  }

  const title = product
    ? `Edit ${product.name}`
    : isEquipment
      ? 'Add new equipment'
      : 'Add a new animal'

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      description="Photos are shown in a fixed portrait frame — adjust each to fit."
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost btn-md">
            Cancel
          </button>
          <button type="submit" form="product-form" className="btn-primary btn-md" disabled={busy}>
            {product ? 'Save changes' : isEquipment ? 'Add equipment' : 'Add animal'}
          </button>
        </div>
      }
    >
      <form id="product-form" onSubmit={submit} noValidate className="space-y-6">
        <ImageManager images={form.images} onChange={setImages} error={errors.images} busy={busy} setBusy={setBusy} />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label={isEquipment ? 'Equipment name' : 'Animal name'} required error={errors.name}>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder={isEquipment ? 'Twin-Bucket Milking Machine' : 'Noor'}
              className={`field-input ${errors.name ? 'field-input-invalid' : ''}`}
            />
          </FormField>
          {isEquipment ? (
            <FormField label="Warranty">
              <input value={form.warranty} onChange={(e) => set('warranty', e.target.value)} placeholder="2 years" className="field-input" />
            </FormField>
          ) : (
            <FormField label="Type">
              <select value={form.type} onChange={(e) => set('type', e.target.value)} className="field-input">
                {ANIMAL_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </FormField>
          )}
        </div>

        <FormField label="Details" hint={`${form.details.length}/${DETAILS_MAX}`}>
          <textarea
            value={form.details}
            onChange={(e) => set('details', e.target.value.slice(0, DETAILS_MAX))}
            maxLength={DETAILS_MAX}
            rows={3}
            placeholder={
              isEquipment
                ? 'A portable twin-bucket milking unit that lets one caretaker milk two animals at a time…'
                : 'A young calf full of energy, just beginning her life on the farm…'
            }
            className="field-input resize-none"
          />
        </FormField>

        {isEquipment ? (
          <FormField label="Life span">
            <input value={form.lifeSpan} onChange={(e) => set('lifeSpan', e.target.value)} placeholder="10 years" className="field-input" />
          </FormField>
        ) : (
          <div className="grid gap-5 sm:grid-cols-3">
            <FormField label="Breed">
              <input value={form.breed} onChange={(e) => set('breed', e.target.value)} placeholder="Sahiwal" className="field-input" />
            </FormField>
            <FormField label="Age">
              <input value={form.age} onChange={(e) => set('age', e.target.value)} placeholder="8 months" className="field-input" />
            </FormField>
            <FormField label="Weight">
              <input value={form.weight} onChange={(e) => set('weight', e.target.value)} placeholder="180 kg" className="field-input" />
            </FormField>
          </div>
        )}

        <FormField label="Sponsorship value (PKR)" required error={errors.valuePKR}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/45">Rs</span>
            <input
              type="number" min="0" step="1000" value={form.valuePKR}
              onChange={(e) => set('valuePKR', e.target.value)} placeholder="120000"
              className={`field-input pl-9 ${errors.valuePKR ? 'field-input-invalid' : ''}`}
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {['USD', 'AUD', 'SAR'].map((c) => (
              <span key={c} className="chip bg-brand-50 text-xs font-medium text-brand-700">
                {formatMoney(conv[c], c)}
              </span>
            ))}
            <span className="text-xs text-ink/40">· auto-calculated at current rates</span>
          </div>
        </FormField>

        {isEquipment ? (
          <div className="flex items-center gap-2 rounded-2xl bg-parchment px-4 py-3 text-sm text-ink/60">
            <Wrench className="h-4 w-4 text-brand-500" aria-hidden="true" />
            Equipment is always owned and maintained by IGA Sial Farm.
          </div>
        ) : collectOwnerInfo ? (
          <div className="rounded-2xl border border-black/5 bg-parchment p-4 sm:p-5">
            <h3 className="font-heading font-semibold text-pine">Animal owner</h3>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => setOwner('ownedByFarm', true)}
                className={`chip cursor-pointer justify-center px-4 py-2.5 text-sm ${form.owner.ownedByFarm ? 'bg-brand-500 text-white' : 'bg-white text-ink/70 border border-black/5'}`}
              >
                <Building2 className="h-4 w-4" aria-hidden="true" />
                IGA Sial Farm owns this animal
              </button>
              <button
                type="button"
                onClick={() => setOwner('ownedByFarm', false)}
                className={`chip cursor-pointer justify-center px-4 py-2.5 text-sm ${!form.owner.ownedByFarm ? 'bg-brand-500 text-white' : 'bg-white text-ink/70 border border-black/5'}`}
              >
                <User2 className="h-4 w-4" aria-hidden="true" />
                A villager owns this animal
              </button>
            </div>

            {!form.owner.ownedByFarm && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField label="Owner first name" required error={errors.ownerFirst}>
                  <input value={form.owner.firstName} onChange={(e) => { setOwner('firstName', e.target.value); if (errors.ownerFirst) setErrors((er) => ({ ...er, ownerFirst: undefined })) }} className={`field-input ${errors.ownerFirst ? 'field-input-invalid' : ''}`} />
                </FormField>
                <FormField label="Owner last name" required error={errors.ownerLast}>
                  <input value={form.owner.lastName} onChange={(e) => { setOwner('lastName', e.target.value); if (errors.ownerLast) setErrors((er) => ({ ...er, ownerLast: undefined })) }} className={`field-input ${errors.ownerLast ? 'field-input-invalid' : ''}`} />
                </FormField>
                <FormField label="CNIC number">
                  <input value={form.owner.cnic} onChange={(e) => setOwner('cnic', e.target.value)} placeholder="35202-1234567-8" className="field-input" />
                </FormField>
                <FormField label="Phone number">
                  <input type="tel" value={form.owner.phone} onChange={(e) => setOwner('phone', e.target.value)} placeholder="+92 300 1234567" className="field-input" />
                </FormField>
                <FormField label="Email" className="sm:col-span-2">
                  <input type="email" value={form.owner.email} onChange={(e) => setOwner('email', e.target.value)} placeholder="name@example.com" className="field-input" />
                </FormField>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-2xl bg-parchment px-4 py-3 text-sm text-ink/60">
            <Building2 className="h-4 w-4 text-brand-500" aria-hidden="true" />
            Owner capture is off in Settings — this animal defaults to IGA Sial Farm ownership.
          </div>
        )}
      </form>
    </Modal>
  )
}

// ---- Image manager: portrait upload + per-image zoom/position adjustment ----
// Shared by animals AND equipment — same component, same adjustments.
function ImageManager({ images, onChange, error, busy, setBusy }) {
  const { toast } = useToast()
  const fileRef = useRef(null)
  const [urlInput, setUrlInput] = useState('')
  const [selected, setSelected] = useState(0)

  const active = images[selected]

  const addImages = async (files) => {
    const remaining = MAX_IMAGES - images.length
    if (remaining <= 0) {
      toast(`You can add up to ${MAX_IMAGES} photos.`, { type: 'info' })
      return
    }
    setBusy(true)
    try {
      const chosen = Array.from(files).slice(0, remaining)
      const added = []
      for (const file of chosen) {
        try {
          added.push(normalizeImage(await fileToScaledDataURL(file)))
        } catch {
          toast('One file could not be added.', { type: 'error' })
        }
      }
      if (added.length) {
        const next = [...images, ...added].slice(0, MAX_IMAGES)
        onChange(next)
        setSelected(next.length - 1)
      }
    } finally {
      setBusy(false)
    }
  }

  const addUrl = () => {
    const url = urlInput.trim()
    if (!url) return
    if (images.length >= MAX_IMAGES) {
      toast(`You can add up to ${MAX_IMAGES} photos.`, { type: 'info' })
      return
    }
    const next = [...images, normalizeImage(url)]
    onChange(next)
    setSelected(next.length - 1)
    setUrlInput('')
  }

  const removeImage = (i) => {
    const next = images.filter((_, idx) => idx !== i)
    onChange(next)
    setSelected((s) => Math.max(0, Math.min(s, next.length - 1)))
  }

  const adjust = (patch) => {
    onChange(images.map((img, i) => (i === selected ? { ...normalizeImage(img), ...patch } : img)))
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-ink">
          Photos <span className="text-ink/45">({images.length}/{MAX_IMAGES}) · portrait</span>
          <span className="text-red-500"> *</span>
        </label>
      </div>

      {/* Portrait thumbnails strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {images.map((img, i) => (
          <div key={i} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setSelected(i)}
              className={`h-24 w-[76px] overflow-hidden rounded-xl border-2 bg-sand transition-all ${i === selected ? 'border-brand-500' : 'border-transparent'}`}
              aria-label={`Select photo ${i + 1}`}
              aria-current={i === selected}
            >
              <img src={imageUrl(img)} alt="" style={imageStyle(img)} className="h-full w-full object-cover" />
            </button>
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-cream shadow-md"
              aria-label={`Remove photo ${i + 1}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {i === 0 && (
              <span className="absolute inset-x-0 bottom-0 rounded-b-xl bg-ink/60 py-0.5 text-center text-[10px] text-cream">Cover</span>
            )}
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex h-24 w-[76px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-brand-200 text-brand-500 transition-colors hover:border-brand-400 hover:bg-brand-50 disabled:opacity-50"
          >
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
            <span className="text-[11px] font-medium">Add</span>
          </button>
        )}
      </div>

      <input
        ref={fileRef} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => { addImages(e.target.files); e.target.value = '' }}
      />

      {/* Adjustment panel for the selected image */}
      {active && (
        <div className="mt-3 grid gap-4 rounded-2xl border border-black/5 bg-parchment p-3 sm:grid-cols-[auto_1fr] sm:p-4">
          <div className="mx-auto h-52 w-[168px] overflow-hidden rounded-xl border border-black/10 bg-sand">
            <img src={imageUrl(active)} alt="Selected preview" style={imageStyle(active)} className="h-full w-full object-cover" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink">Fit photo {selected + 1} to frame</p>
              <button
                type="button"
                onClick={() => adjust({ zoom: 1, posX: 50, posY: 50 })}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-800"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset
              </button>
            </div>
            <Slider icon={ZoomIn} label="Zoom" min={1} max={2.5} step={0.05} value={normalizeImage(active).zoom} onChange={(v) => adjust({ zoom: v })} suffix="×" />
            <Slider icon={MoveHorizontal} label="Horizontal" min={0} max={100} step={1} value={normalizeImage(active).posX} onChange={(v) => adjust({ posX: v })} suffix="%" />
            <Slider icon={MoveVertical} label="Vertical" min={0} max={100} step={1} value={normalizeImage(active).posY} onChange={(v) => adjust({ posY: v })} suffix="%" />
          </div>
        </div>
      )}

      {/* Add by URL */}
      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" aria-hidden="true" />
          <input
            type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl() } }}
            placeholder="or paste an image URL" className="field-input pl-9"
          />
        </div>
        <button type="button" onClick={addUrl} className="btn-outline btn-md shrink-0">
          <Upload className="h-4 w-4" aria-hidden="true" />
          Add
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

function Slider({ icon: Icon, label, min, max, step, value, onChange, suffix }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-ink/45" aria-hidden="true" />
      <span className="w-20 shrink-0 text-xs text-ink/60">{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-brand-500"
        aria-label={label}
      />
      <span className="w-12 shrink-0 text-right text-xs tabular-nums text-ink/60">
        {step < 1 ? value.toFixed(2) : Math.round(value)}{suffix}
      </span>
    </div>
  )
}

function FormField({ label, required, hint, error, children, className = '' }) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-ink">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
        {hint && <span className="text-xs text-ink/40">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
