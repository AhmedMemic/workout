import { Page } from '../components/Page'
import { LangToggle } from '../components/LangToggle'
import { useT } from '../i18n/I18nProvider'
import type { MessageKey } from '../i18n/en'

/** Temporary screen until the real feature lands. */
export function Placeholder({ titleKey }: { titleKey: MessageKey }) {
  const { t } = useT()
  return (
    <Page title={t(titleKey)} actions={<LangToggle />}>
      <p className="muted">{t('common.comingSoon')}</p>
    </Page>
  )
}
