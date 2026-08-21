import { useState } from 'react'
import { MailCheck, MailWarning, Mail } from 'lucide-react'
import Badge from '../../shared/ui/Badge.jsx'
import Button from '../../shared/ui/Button.jsx'
import styles from './EmailDeliveryStatus.module.css'

const icon = { sent: MailCheck, failed: MailWarning, pending: Mail }
const tone = { sent: 'success', failed: 'error', pending: 'watch' }
const label = { sent: 'Emailed to admin', failed: 'Email failed', pending: 'Sending email' }

function EmailDeliveryStatus({ delivery }) {
  const [state, setState] = useState(delivery)
  const Icon = icon[state.status]

  return (
    <div className={styles.card}>
      <Icon size={20} />
      <div className={styles.info}>
        <div className={styles.top}>
          <strong>{state.fileName}</strong>
          <Badge tone={tone[state.status]}>{label[state.status]}</Badge>
        </div>
        <p>
          {state.recipient}
          {state.sentAt && ` • ${state.sentAt}`}
        </p>
      </div>
      {state.status === 'failed' && (
        <Button variant="secondary" onClick={() => setState({ ...state, status: 'sent', sentAt: 'Just now' })}>
          Resend
        </Button>
      )}
    </div>
  )
}

export default EmailDeliveryStatus
