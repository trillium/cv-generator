import './globals.css'
import { Toaster } from 'sonner'
import Navigation from '@/components/Navigation/Navigation'
import PageContainer from '@/components/PageContainer'
import Modal from '@/components/ui/modal'
import { ModalProvider } from '@/contexts/ModalContext'
import { DirectoryManagerProvider } from '@/src/contexts/DirectoryManagerContext'
import { ThemeProviders } from './theme-providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="bg-white dark:bg-gray-800 min-w-2xl">
        <ThemeProviders>
          <DirectoryManagerProvider>
            <ModalProvider>
              <Navigation />
              <div className="m-6 print:m-0">
                <PageContainer>{children}</PageContainer>
              </div>
              <Modal />
              <Toaster />
            </ModalProvider>
          </DirectoryManagerProvider>
        </ThemeProviders>
      </body>
    </html>
  )
}
