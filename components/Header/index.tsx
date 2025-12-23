'use client'

import Link from 'next/link'
import { useHeader } from './useHeader'
import './Header.scss'

interface Props {
  showNav?: boolean
}

export default function Header({ showNav = true }: Props) {
  const { handleLogout, isActive, navLinks } = useHeader()

  return (
    <header className="Header">
      <div className="title">
        <h1>WebDeploy</h1>
      </div>

      {showNav && (
        <>
          <nav className="nav">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${isActive(link.href)}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="logout-btn"
          >
            Logout
          </button>
        </>
      )}
    </header>
  )
}
