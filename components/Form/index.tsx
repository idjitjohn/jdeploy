import './Form.scss'

interface Props {
  children: React.ReactNode
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void
  className?: string
}

export default function Form({
  children,
  onSubmit,
  className = ''
}: Props) {
  return (
    <form className={`Form ${className}`} onSubmit={onSubmit}>
      {children}
    </form>
  )
}
