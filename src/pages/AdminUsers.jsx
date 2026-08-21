import { useCallback, useEffect, useState } from 'react'
import {
  UserPlus, Pencil, Trash2, Mail, ShieldCheck, Users, AlertTriangle, CheckCircle2, CircleSlash,
  Send, MailQuestion,
} from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Modal from '../components/Modal.jsx'
import { useApp } from '../store/AppContext.jsx'
import { useToast } from '../store/ToastContext.jsx'
import { isEmail, formatDate } from '../lib/helpers.js'
import { fetchAdmins, inviteAdmin, updateAdmin, deleteAdmin } from '../supabase/api.js'

const ROLES = ['owner', 'admin']

export default function AdminUsers() {
  const { session } = useApp()
  const { toast } = useToast()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [resending, setResending] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState('')

  const load = useCallback(async () => {
    try {
      setAdmins(await fetchAdmins())
    } catch (e) {
      toast(e.message, { type: 'error', duration: 6000 })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const doDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      const { hardDeleted } = await deleteAdmin(confirmDelete.id)
      if (hardDeleted) {
        toast(`${confirmDelete.email} was deleted from Supabase.`, { type: 'info' })
      } else {
        // Migration 0005 not applied: say so rather than implying it's gone.
        toast(
          `${confirmDelete.email} lost panel access, but their Supabase login still exists. Apply migration 0005 to delete accounts fully.`,
          { type: 'error', duration: 9000 },
        )
      }
      await load()
    } catch (e) {
      toast(e.message, { type: 'error', duration: 6000 })
    } finally {
      setDeleting(false)
      setConfirmDelete(null)
    }
  }

  // An invited admin who never opened their e-mail can be sent another link.
  const doResend = async (admin) => {
    setResending(admin.id)
    try {
      await inviteAdmin(admin.email, admin.fullName, admin.role)
      toast(`A fresh invitation is on its way to ${admin.email}.`, { duration: 6000 })
    } catch (e) {
      toast(e.message, { type: 'error', duration: 6000 })
    } finally {
      setResending('')
    }
  }

  const toggleActive = async (admin) => {
    if (togglingId === admin.id) return
    setTogglingId(admin.id)
    try {
      await updateAdmin(admin.id, { active: !admin.active })
      toast(admin.active ? `${admin.email} deactivated.` : `${admin.email} reactivated.`, { type: 'info' })
      await load()
    } catch (e) {
      toast(e.message, { type: 'error', duration: 6000 })
    } finally {
      setTogglingId('')
    }
  }

  return (
    <>
      <PageHeader
        hideBack
        eyebrow="Admin users"
        title="Who can sign in"
        subtitle="Invite teammates to the control panel, change their role, or take their access away."
        actions={
          <button onClick={() => setInvite(true)} className="btn-primary btn-md">
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Invite admin
          </button>
        }
      />

      <div className="container-x max-w-4xl py-8 sm:py-12">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-3xl bg-sand" />
            ))}
          </div>
        ) : admins.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No admin users yet"
            description="Invite your first teammate by email. They receive a link to set their own password."
            action={
              <button onClick={() => setInvite(true)} className="btn-primary btn-md">
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Invite admin
              </button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {admins.map((a) => {
              const isMe = a.id === session?.user?.id
              // `pending === null` means the database can't tell us yet
              // (migration 0005), so we say nothing rather than guess.
              const invited = a.pending === true && a.active
              return (
                <li
                  key={a.id}
                  className="card flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        invited ? 'bg-gold-100 text-gold-800' : 'bg-brand-50 text-brand-600'
                      }`}
                    >
                      {invited
                        ? <MailQuestion className="h-5 w-5" aria-hidden="true" />
                        : <ShieldCheck className="h-5 w-5" aria-hidden="true" />}
                    </span>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-heading font-semibold text-pine">
                        <span className="truncate">{a.fullName || a.email}</span>
                        {/* Someone who has never signed in is not an admin yet —
                            they are an outstanding invitation. Showing their
                            role here read as "this person is now Super Admin",
                            which was wrong and confusing. */}
                        {invited ? (
                          <span className="chip bg-gold-100 text-[11px] font-semibold text-gold-800">
                            Invited
                          </span>
                        ) : (
                          <span className="chip bg-brand-50 text-[11px] capitalize text-brand-700">{a.role}</span>
                        )}
                        {isMe && <span className="chip bg-gold-100 text-[11px] text-gold-800">You</span>}
                        {!a.active && (
                          <span className="chip bg-red-50 text-[11px] text-red-600">Deactivated</span>
                        )}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-ink/55">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-brand-400" aria-hidden="true" />
                        {a.email}
                      </p>
                      {invited ? (
                        <p className="mt-0.5 text-xs text-gold-800">
                          Invitation sent{a.createdAt ? ` ${formatDate(a.createdAt)}` : ''} — they become{' '}
                          <span className="capitalize">{a.role}</span> once they sign in for the first time.
                        </p>
                      ) : (
                        <p className="mt-0.5 text-xs text-ink/40">
                          {a.lastSignInAt
                            ? `Last signed in ${formatDate(a.lastSignInAt)}`
                            : a.createdAt ? `Added ${formatDate(a.createdAt)}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {invited && (
                      <button
                        onClick={() => doResend(a)}
                        disabled={resending === a.id}
                        className="btn-outline btn-sm"
                      >
                        <Send className="h-4 w-4" aria-hidden="true" />
                        {resending === a.id ? 'Sending…' : 'Resend invite'}
                      </button>
                    )}
                    <button onClick={() => setEditing(a)} className="btn-outline btn-sm">
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      onClick={() => toggleActive(a)}
                      disabled={isMe || togglingId === a.id}
                      className="btn-ghost btn-sm"
                      title={isMe ? 'You can’t deactivate your own account.' : undefined}
                    >
                      {togglingId === a.id ? (
                        togglingId === a.id && 'Updating…'
                      ) : a.active ? (
                        <>
                          <CircleSlash className="h-4 w-4" aria-hidden="true" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          Reactivate
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(a)}
                      disabled={isMe}
                      className="btn-sm btn border border-red-200 bg-white text-red-600 hover:bg-red-50 focus-visible:ring-red-400 disabled:opacity-40"
                      aria-label={`Delete ${a.email}`}
                      title={isMe ? 'You can’t delete your own account.' : undefined}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <p className="mt-6 rounded-2xl bg-parchment px-4 py-3 text-sm text-ink/60">
          Invited users receive an email with a link that brings them here to set their own password.
          The link works on any phone, tablet or computer — not only the device the invite was sent
          from. Someone stays <span className="font-medium text-ink">Invited</span> until they sign in
          for the first time. Removing an admin deletes their account from Supabase entirely, so the
          same email address can be invited again later.
        </p>
      </div>

      {invite && (
        <InviteModal
          onClose={() => setInvite(false)}
          onDone={async (email, result) => {
            toast(
              result?.existing
                ? `${email} already had an account — their admin access is restored and a sign-in link is on its way.`
                : `Invitation sent to ${email}.`,
              { duration: 6000 },
            )
            setInvite(false)
            await load()
          }}
        />
      )}

      {editing && (
        <EditModal
          admin={editing}
          onClose={() => setEditing(null)}
          onDone={async (name) => {
            toast(`${name || editing.email} was updated.`)
            setEditing(null)
            await load()
          }}
        />
      )}

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remove admin"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirmDelete(null)} className="btn-ghost btn-md">Keep access</button>
            <button
              onClick={doDelete}
              className="btn-md btn bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500"
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {deleting ? 'Removing…' : 'Remove'}
            </button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <p className="text-ink/75">
            Delete <span className="font-semibold text-ink">{confirmDelete?.email}</span>? Their
            Supabase account is removed along with their profile, any active session ends
            immediately, and this cannot be undone. You can invite the same email address again
            afterwards.
          </p>
        </div>
      </Modal>
    </>
  )
}

function InviteModal({ onClose, onDone }) {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('Shamila Shajer')
  const [role, setRole] = useState('admin')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (ev) => {
    ev.preventDefault()
    if (!isEmail(email)) {
      setError('Enter a valid email address.')
      return
    }
    setError('')
    setBusy(true)
    try {
      const result = await inviteAdmin(email.trim(), fullName.trim(), role)
      await onDone(email.trim(), result)
    } catch (e) {
      toast(e.message, { type: 'error', duration: 6000 })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Invite an admin"
      description="They receive an email with a link to set their password."
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost btn-md">Cancel</button>
          <button type="submit" form="invite-form" className="btn-primary btn-md" disabled={busy}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            {busy ? 'Sending…' : 'Send invite'}
          </button>
        </div>
      }
    >
      <form id="invite-form" onSubmit={submit} noValidate className="grid gap-4">
        <div>
          <label className="field-label" htmlFor="invite-email">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com" aria-invalid={!!error}
            className={`field-input ${error ? 'field-input-invalid' : ''}`}
          />
          {error && <p className="mt-1 text-sm text-red-600" role="alert">{error}</p>}
        </div>
        <div>
          <label className="field-label" htmlFor="invite-name">Full name</label>
          <input
            id="invite-name" value={fullName} onChange={(e) => setFullName(e.target.value)}
            placeholder="Shamila Shajer" className="field-input"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="invite-role">Role</label>
          <select id="invite-role" value={role} onChange={(e) => setRole(e.target.value)} className="field-input">
            {ROLES.map((r) => (
              <option key={r} value={r}>{r === 'owner' ? 'Owner' : 'Admin'}</option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  )
}

function EditModal({ admin, onClose, onDone }) {
  const { toast } = useToast()
  const [fullName, setFullName] = useState(admin.fullName || 'Shamila Shajer')
  const [role, setRole] = useState(admin.role || 'admin')
  const [busy, setBusy] = useState(false)

  const submit = async (ev) => {
    ev.preventDefault()
    setBusy(true)
    try {
      await updateAdmin(admin.id, { fullName: fullName.trim(), role })
      await onDone(fullName.trim())
    } catch (e) {
      toast(e.message, { type: 'error', duration: 6000 })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit ${admin.email}`}
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost btn-md">Cancel</button>
          <button type="submit" form="edit-admin-form" className="btn-primary btn-md" disabled={busy}>
            Save changes
          </button>
        </div>
      }
    >
      <form id="edit-admin-form" onSubmit={submit} noValidate className="grid gap-4">
        <div>
          <label className="field-label" htmlFor="edit-name">Full name</label>
          <input
            id="edit-name" value={fullName} onChange={(e) => setFullName(e.target.value)}
            placeholder="Shamila Shajer" className="field-input"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="edit-role">Role</label>
          <select id="edit-role" value={role} onChange={(e) => setRole(e.target.value)} className="field-input">
            {ROLES.map((r) => (
              <option key={r} value={r}>{r === 'owner' ? 'Owner' : 'Admin'}</option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  )
}
