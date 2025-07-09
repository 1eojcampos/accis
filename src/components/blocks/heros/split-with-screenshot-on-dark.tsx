"use client"

import { ChevronRight } from 'lucide-react'

export default function SplitWithScreenshotOnDark() {
  return (
    <div className="relative isolate overflow-hidden" style={{ backgroundColor: 'var(--color-background)' }}>
      <svg
        aria-hidden="true"
        className="absolute inset-0 -z-10 size-full mask-[radial-gradient(100%_100%_at_top_right,white,transparent)] stroke-white/10"
      >
        <defs>
          <pattern
            x="50%"
            y={-1}
            id="983e3e4c-de6d-4c3f-8d64-b9761d1534cc"
            width={200}
            height={200}
            patternUnits="userSpaceOnUse"
          >
            <path d="M.5 200V.5H200" fill="none" />
          </pattern>
        </defs>
        <svg x="50%" y={-1} className="overflow-visible fill-neutral-800/20">
          <path
            d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
            strokeWidth={0}
          />
        </svg>
        <rect fill="url(#983e3e4c-de6d-4c3f-8d64-b9761d1534cc)" width="100%" height="100%" strokeWidth={0} />
      </svg>
      <div
        aria-hidden="true"
        className="absolute top-10 left-[calc(50%-4rem)] -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:top-[calc(50%-30rem)] lg:left-48 xl:left-[calc(50%-24rem)]"
      >
        <div
          style={{
            clipPath:
              'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
            backgroundColor: '#10b981'
          }}
          className="aspect-1108/632 w-277 opacity-20"
        />
      </div>
      <div className="mx-auto max-w-7xl px-6 pt-10 pb-24 sm:pb-32 lg:flex lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl shrink-0 lg:mx-0 lg:pt-8">
          <img
            alt="3DPrint Connect"
            src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
            className="h-11"
          />
          <div className="mt-24 sm:mt-32 lg:mt-16">
            <a href="#" className="inline-flex space-x-6">
              <span className="rounded-full px-3 py-1 text-sm/6 font-semibold ring-1 ring-inset" style={{ 
                backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                color: '#10b981',
                borderColor: 'rgba(16, 185, 129, 0.2)'
              }}>
                Platform Launch
              </span>
              <span className="inline-flex items-center space-x-2 text-sm/6 font-medium text-neutral-300">
                <span>Now accepting providers</span>
                <ChevronRight aria-hidden="true" className="size-5 text-neutral-500" />
              </span>
            </a>
          </div>
          <h1 className="mt-10 text-5xl font-semibold tracking-tight text-pretty font-[var(--font-display)]" style={{ color: 'var(--color-foreground)' }} >
            On-Demand 3D Printing Services
          </h1>
          <p className="mt-8 text-lg font-medium text-pretty text-neutral-400 sm:text-xl/8 font-[var(--font-body)]">
            Connect with local 3D printing providers, upload your designs, and get professional prints delivered to your door.
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <a
              href="#"
              className="rounded-md px-3.5 py-2.5 text-sm font-semibold shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 font-[var(--font-display)]"
              style={{ 
                backgroundColor: '#10b981', 
                color: 'var(--color-primary-foreground)',
                borderColor: '#10b981'
              }}
            >
              Find Printers Nearby
            </a>
            <a href="#" className="text-sm/6 font-semibold font-[var(--font-display)]" style={{ color: 'var(--color-foreground)' }}>
              Become a Provider <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:mt-0 lg:mr-0 lg:ml-10 lg:max-w-none lg:flex-none xl:ml-32">
          <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
            <div className="w-304 rounded-md shadow-2xl ring-1 ring-white/10" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold font-[var(--font-display)]" style={{ color: 'var(--color-foreground)' }}>Find Local Printers</h3>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-card)' }}>
                    <div className="w-full h-24 rounded-md bg-neutral-600 mb-3"></div>
                    <h4 className="font-medium text-sm font-[var(--font-display)]" style={{ color: 'var(--color-foreground)' }}>PrintHub Pro</h4>
                    <p className="text-xs text-neutral-400">0.3 miles away</p>
                    <div className="flex items-center mt-2">
                      <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#10b981' }}></div>
                      <span className="text-xs" style={{ color: '#10b981' }}>Available</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-card)' }}>
                    <div className="w-full h-24 rounded-md bg-neutral-600 mb-3"></div>
                    <h4 className="font-medium text-sm font-[var(--font-display)]" style={{ color: 'var(--color-foreground)' }}>Maker Space</h4>
                    <p className="text-xs text-neutral-400">0.7 miles away</p>
                    <div className="flex items-center mt-2">
                      <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#10b981' }}></div>
                      <span className="text-xs" style={{ color: '#10b981' }}>Available</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-card)' }}>
                    <div className="w-full h-24 rounded-md bg-neutral-600 mb-3"></div>
                    <h4 className="font-medium text-sm font-[var(--font-display)]" style={{ color: 'var(--color-foreground)' }}>3D Solutions</h4>
                    <p className="text-xs text-neutral-400">1.2 miles away</p>
                    <div className="flex items-center mt-2">
                      <div className="w-2 h-2 rounded-full mr-2 bg-orange-500"></div>
                      <span className="text-xs text-orange-500">Busy</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-card)' }}>
                    <div className="w-full h-24 rounded-md bg-neutral-600 mb-3"></div>
                    <h4 className="font-medium text-sm font-[var(--font-display)]" style={{ color: 'var(--color-foreground)' }}>Quick Print Co</h4>
                    <p className="text-xs text-neutral-400">1.8 miles away</p>
                    <div className="flex items-center mt-2">
                      <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#10b981' }}></div>
                      <span className="text-xs" style={{ color: '#10b981' }}>Available</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}