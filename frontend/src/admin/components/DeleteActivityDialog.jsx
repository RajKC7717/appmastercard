import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '../../shared/ui/Button.jsx';
import Modal from '../../shared/ui/Modal.jsx';
import { Field, TextInput } from '../../shared/ui/Form.jsx';
import styles from '../../shared/console/console.module.css';

/**
 * Deleting an activity is the one destructive action in the console, so
 * it is the one place that asks before acting rather than acting with an
 * undo. An undo toast is right for something reversible in eight seconds;
 * it is wrong for a record that is gone.
 *
 * The confirmation asks the person to type the activity name. That is not
 * ceremony — it is the difference between misreading a row and deciding
 * to delete this specific activity.
 *
 * Only an activity created in this console with nobody registered against
 * it ever reaches here. Anything with a registration behind it is
 * cancelled instead, because `event_registrations.event_id` is a RESTRICT
 * foreign key: the database would refuse the delete, and an interface
 * that offers what the database refuses is lying to the user.
 */
export default function DeleteActivityDialog({ open, onClose, onConfirm, event }) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');

  useEffect(() => {
    if (!open) return;
    setTyped('');
    setBusy(false);
    setFailure('');
  }, [open]);

  if (!event) return null;

  const confirmed = typed.trim().toLowerCase() === event.eventName.trim().toLowerCase();

  const remove = async () => {
    if (!confirmed) {
      setFailure('Type the activity name exactly to confirm.');
      return;
    }
    setBusy(true);
    const result = await onConfirm();
    setBusy(false);
    if (!result?.ok) setFailure(result?.error ?? 'We could not delete this activity.');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete this activity?"
      description="This cannot be undone. Nobody has registered for it, so no volunteer record is affected."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Keep it
          </Button>
          <Button variant="danger" onClick={remove} disabled={busy || !confirmed}>
            {busy ? 'Deleting…' : 'Delete activity'}
          </Button>
        </>
      }
    >
      <div className={styles.stack}>
        <p className={styles.finding}>
          <AlertTriangle size={16} aria-hidden="true" /> <strong>{event.eventName}</strong> for{' '}
          {event.companyName} will be removed permanently. If volunteers have already been told
          about it, cancel it instead — a cancelled activity stays visible with its reason.
        </p>

        <Field
          label={`Type “${event.eventName}” to confirm`}
          htmlFor="confirm-delete"
          error={failure}
        >
          <TextInput
            id="confirm-delete"
            value={typed}
            onChange={(changeEvent) => {
              setTyped(changeEvent.target.value);
              setFailure('');
            }}
            invalid={Boolean(failure)}
            autoComplete="off"
            placeholder={event.eventName}
          />
        </Field>
      </div>
    </Modal>
  );
}
