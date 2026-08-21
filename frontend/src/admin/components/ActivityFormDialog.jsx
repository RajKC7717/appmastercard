import { useEffect, useState } from 'react';
import Button from '../../shared/ui/Button.jsx';
import Modal from '../../shared/ui/Modal.jsx';
import { Field, SelectInput, TextArea, TextInput } from '../../shared/ui/Form.jsx';
import { ACTIVITY_TYPES, EVENT_STATUSES, STATUS_LABEL } from '../../shared/data/orgData.js';
import styles from '../../shared/console/console.module.css';

const AREAS = [
  'Kothrud', 'Hadapsar', 'Wagholi', 'Pimpri', 'Chinchwad', 'Katraj',
  'Bhosari', 'Kharadi', 'Warje', 'Baner', 'Hinjewadi', 'Yerawada',
];

const BLANK = {
  eventName: '',
  companyId: '',
  activityType: 'Community',
  eventDate: '',
  startTime: '09:00',
  endTime: '13:00',
  location: '',
  area: 'Kothrud',
  volunteersNeeded: '30',
  description: '',
  status: 'REGISTRATION_OPEN',
};

/**
 * Create or edit an activity — the record every feedback hangs off.
 *
 * Single column, labels above every field, error space reserved under
 * each one so validating a field never shifts the fields below it.
 *
 * Area is a dropdown of real Pune localities rather than free text. Free
 * text there destroys every filter and every report downstream: "Kharadi",
 * "kharadi" and "Khardi" become three areas, and "which areas are we
 * under-serving?" stops having an answer.
 *
 * `initial` turns this into an edit dialog; the fields and the validation
 * are identical, so the two can never disagree about what a valid
 * activity is.
 */
export default function ActivityFormDialog({ open, onClose, onSubmit, companies, initial = null }) {
  const editing = Boolean(initial);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);

  /* Reopening starts clean, or from the record being edited — never from
     whatever the last person happened to type. */
  useEffect(() => {
    if (!open) return;
    setForm(
      initial
        ? {
            eventName: initial.eventName,
            companyId: initial.companyId,
            activityType: initial.activityType,
            eventDate: initial.eventDate.slice(0, 10),
            startTime: initial.startTime,
            endTime: initial.endTime,
            location: initial.location,
            area: initial.area,
            volunteersNeeded: String(initial.volunteersNeeded),
            description: initial.description,
            status: initial.status,
          }
        : BLANK,
    );
    setErrors({});
    setFailure('');
  }, [open, initial]);

  const change = (key) => (event) => {
    const { value } = event.target;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFailure('');
  };

  const validate = () => {
    const found = {};
    if (!form.eventName.trim()) found.eventName = 'Give the activity a name volunteers will recognise.';
    if (!form.companyId) found.companyId = 'Every activity belongs to exactly one corporate partner.';
    if (!form.eventDate) found.eventDate = 'Choose the date it takes place.';
    if (!form.location.trim()) found.location = 'Where should volunteers report?';
    if (form.endTime <= form.startTime) found.endTime = 'The end time has to be after the start time.';
    const needed = Number(form.volunteersNeeded);
    if (!Number.isFinite(needed) || needed < 1) found.volunteersNeeded = 'How many volunteers do you need?';
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setBusy(true);
    const result = await onSubmit({ ...form, volunteersNeeded: Number(form.volunteersNeeded) });
    setBusy(false);
    if (!result?.ok) setFailure(result?.error ?? 'We could not save this activity.');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit activity' : 'Create activity'}
      description={
        editing
          ? 'Changes are visible to the corporate SPOC and to registered volunteers straight away.'
          : 'Volunteers see this the moment its status is Registration open.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Create activity'}
          </Button>
        </>
      }
    >
      <form className={styles.stack} onSubmit={submit} noValidate>
        <Field label="Activity name" htmlFor="eventName" error={errors.eventName} required>
          <TextInput
            id="eventName"
            value={form.eventName}
            onChange={change('eventName')}
            invalid={Boolean(errors.eventName)}
            placeholder="Miyawaki Tree Plantation Drive"
          />
        </Field>

        <Field
          label="Corporate partner"
          htmlFor="companyId"
          error={errors.companyId}
          hint="Feedback is grouped by this, so it cannot be changed later."
          required
        >
          <SelectInput
            id="companyId"
            placeholder="Choose a partner"
            value={form.companyId}
            onChange={change('companyId')}
            invalid={Boolean(errors.companyId)}
            disabled={editing}
            options={companies.map((company) => ({
              value: company.companyId,
              label: company.companyName,
            }))}
          />
        </Field>

        <Field label="Type" htmlFor="activityType">
          <SelectInput
            id="activityType"
            value={form.activityType}
            onChange={change('activityType')}
            options={ACTIVITY_TYPES}
          />
        </Field>

        <Field label="Date" htmlFor="eventDate" error={errors.eventDate} required>
          <TextInput
            id="eventDate"
            type="date"
            value={form.eventDate}
            onChange={change('eventDate')}
            invalid={Boolean(errors.eventDate)}
          />
        </Field>

        <Field label="Starts at" htmlFor="startTime">
          <TextInput id="startTime" type="time" value={form.startTime} onChange={change('startTime')} />
        </Field>

        <Field
          label="Ends at"
          htmlFor="endTime"
          error={errors.endTime}
          hint="The feedback form opens the minute this activity ends and closes at midnight."
        >
          <TextInput
            id="endTime"
            type="time"
            value={form.endTime}
            onChange={change('endTime')}
            invalid={Boolean(errors.endTime)}
          />
        </Field>

        <Field label="Venue" htmlFor="location" error={errors.location} required>
          <TextInput
            id="location"
            value={form.location}
            onChange={change('location')}
            invalid={Boolean(errors.location)}
            placeholder="EON IT Park grounds"
          />
        </Field>

        <Field
          label="Area"
          htmlFor="area"
          hint="A fixed list, not free text — every area report depends on it."
        >
          <SelectInput id="area" value={form.area} onChange={change('area')} options={AREAS} />
        </Field>

        <Field
          label="Volunteers needed"
          htmlFor="volunteersNeeded"
          error={errors.volunteersNeeded}
          required
        >
          <TextInput
            id="volunteersNeeded"
            type="number"
            inputMode="numeric"
            min={1}
            value={form.volunteersNeeded}
            onChange={change('volunteersNeeded')}
            invalid={Boolean(errors.volunteersNeeded)}
          />
        </Field>

        <Field label="Status" htmlFor="status">
          <SelectInput
            id="status"
            value={form.status}
            onChange={change('status')}
            options={EVENT_STATUSES.map((value) => ({ value, label: STATUS_LABEL[value] }))}
          />
        </Field>

        <Field
          label="What volunteers will do"
          htmlFor="description"
          hint="One or two sentences. This is all a volunteer reads before registering."
        >
          <TextArea id="description" value={form.description} onChange={change('description')} />
        </Field>

        {failure && (
          <p className={styles.countWarn} role="alert">
            {failure}
          </p>
        )}
      </form>
    </Modal>
  );
}
