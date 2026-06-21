import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Ein Klick und du bist drin. Komma wartet. 🚀</Preview>
    <Body style={main}>
      <Container style={outer}>
        <Container style={card}>
          <Text style={brand}>komma,</Text>

          <Heading style={h1}>
            Yes. Du bist <span style={accent}>fast</span> drin.
          </Heading>

          <Text style={lead}>
            Noch ein Tap und du startest deine erste Challenge, lädst deine Crew
            ein und sammelst Aura.
          </Text>

          <Section style={buttonWrap}>
            <Button style={button} href={confirmationUrl}>
              Account aktivieren →
            </Button>
          </Section>

          <Text style={smallMuted}>
            Bestätigt deine Adresse <strong style={strong}>{recipient}</strong>.
            Der Link gilt 24 Stunden.
          </Text>

          <Section style={divider} />

          <Text style={featuresTitle}>Was dich drinnen erwartet</Text>
          <Text style={feature}>
            <span style={dot}>•</span> Tägliche Mini-Challenges für dich & deine Freunde
          </Text>
          <Text style={feature}>
            <span style={dot}>•</span> Eigene Crews, Ligen & Aura-Punkte
          </Text>
          <Text style={feature}>
            <span style={dot}>•</span> Echte Posts statt Doomscrollen
          </Text>

          <Section style={divider} />

          <Text style={footer}>
            Link funktioniert nicht? Kopier ihn in deinen Browser:
            <br />
            <Link href={confirmationUrl} style={fallbackLink}>
              {confirmationUrl}
            </Link>
          </Text>

          <Text style={footerMuted}>
            Du hast dich nicht angemeldet? Ignorier diese Mail einfach.
            <br />
            <Link href={siteUrl} style={legalLink}>
              komma.fun
            </Link>{' '}
            · Mitmachen statt zuschauen
          </Text>
        </Container>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

// Body must stay white for deliverability — the card inside is the dark brand surface
const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: 0,
}
const outer = { padding: '24px 16px', maxWidth: '560px' }
const card = {
  backgroundColor: '#1a1426',
  borderRadius: '20px',
  padding: '40px 32px',
  color: '#ffffff',
}
const brand = {
  fontSize: '14px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: '#ec4ec0',
  fontWeight: 700,
  margin: '0 0 28px',
}
const h1 = {
  fontSize: '32px',
  lineHeight: '1.15',
  fontWeight: 800,
  color: '#ffffff',
  margin: '0 0 16px',
  letterSpacing: '-0.02em',
}
const accent = { color: '#d4f54a' }
const lead = {
  fontSize: '16px',
  lineHeight: '1.55',
  color: '#cfc6dd',
  margin: '0 0 28px',
}
const buttonWrap = { margin: '0 0 16px' }
const button = {
  display: 'inline-block',
  backgroundColor: '#ec4ec0',
  color: '#1a1426',
  fontSize: '16px',
  fontWeight: 700,
  borderRadius: '999px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const smallMuted = {
  fontSize: '13px',
  color: '#9c93ad',
  lineHeight: '1.5',
  margin: '0 0 8px',
}
const strong = { color: '#ffffff', fontWeight: 600 }
const divider = {
  borderTop: '1px solid #2d2440',
  margin: '28px 0',
  height: '1px',
  lineHeight: '1px',
}
const featuresTitle = {
  fontSize: '13px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: '#9c93ad',
  fontWeight: 600,
  margin: '0 0 12px',
}
const feature = {
  fontSize: '15px',
  color: '#e8e3f0',
  lineHeight: '1.6',
  margin: '0 0 6px',
}
const dot = { color: '#d4f54a', marginRight: '8px', fontWeight: 700 }
const footer = {
  fontSize: '12px',
  color: '#9c93ad',
  lineHeight: '1.6',
  margin: '0 0 16px',
  wordBreak: 'break-all' as const,
}
const fallbackLink = { color: '#ec4ec0', textDecoration: 'underline' }
const footerMuted = {
  fontSize: '12px',
  color: '#7a708d',
  lineHeight: '1.6',
  margin: '16px 0 0',
}
const legalLink = { color: '#9c93ad', textDecoration: 'underline' }
