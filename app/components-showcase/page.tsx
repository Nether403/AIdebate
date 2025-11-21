'use client'

import { useState } from 'react'
import { 
  Button, 
  Card, 
  Badge, 
  Alert, 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent,
  LoadingSpinner,
  Skeleton,
  Container
} from '@/components/layout'
import { Play, Pause, Download, Upload, Heart, Star } from 'lucide-react'

export default function ComponentShowcase() {
  const [isLoading, setIsLoading] = useState(false)
  const [showAlert, setShowAlert] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12">
      <Container size="xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Component Showcase</h1>
          <p className="text-slate-400 text-lg">
            A comprehensive showcase of all UI components in the AI Debate Arena platform.
          </p>
        </div>

        <Tabs defaultValue="buttons" className="space-y-8">
          <TabsList>
            <TabsTrigger value="buttons">Buttons</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="loading">Loading</TabsTrigger>
          </TabsList>

          {/* Buttons Tab */}
          <TabsContent value="buttons">
            <Card>
              <h2 className="text-2xl font-bold text-white mb-6">Buttons</h2>
              
              <div className="space-y-8">
                {/* Variants */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Variants</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="danger">Danger</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="outline">Outline</Button>
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Sizes</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                  </div>
                </div>

                {/* With Icons */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">With Icons</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button leftIcon={<Play className="w-4 h-4" />}>Play</Button>
                    <Button leftIcon={<Pause className="w-4 h-4" />} variant="secondary">
                      Pause
                    </Button>
                    <Button rightIcon={<Download className="w-4 h-4" />}>Download</Button>
                    <Button 
                      leftIcon={<Upload className="w-4 h-4" />}
                      rightIcon={<Star className="w-4 h-4" />}
                      variant="outline"
                    >
                      Upload & Star
                    </Button>
                  </div>
                </div>

                {/* Loading State */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Loading State</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button 
                      isLoading={isLoading}
                      onClick={() => {
                        setIsLoading(true)
                        setTimeout(() => setIsLoading(false), 2000)
                      }}
                    >
                      Click to Load
                    </Button>
                    <Button isLoading variant="secondary">
                      Loading...
                    </Button>
                  </div>
                </div>

                {/* Disabled */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Disabled</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button disabled>Disabled Primary</Button>
                    <Button disabled variant="secondary">
                      Disabled Secondary
                    </Button>
                  </div>
                </div>

                {/* Full Width */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Full Width</h3>
                  <Button fullWidth>Full Width Button</Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Cards Tab */}
          <TabsContent value="cards">
            <div className="space-y-6">
              <Card>
                <h2 className="text-2xl font-bold text-white mb-6">Cards</h2>
                
                <div className="space-y-6">
                  {/* Basic Card */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Basic Card</h3>
                    <Card padding="md">
                      <h4 className="text-white font-semibold mb-2">Card Title</h4>
                      <p className="text-slate-400 text-sm">
                        This is a basic card with default styling and medium padding.
                      </p>
                    </Card>
                  </div>

                  {/* Hoverable Card */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Hoverable Card</h3>
                    <Card hover padding="md">
                      <h4 className="text-white font-semibold mb-2">Hover Me!</h4>
                      <p className="text-slate-400 text-sm">
                        This card has a hover effect with scale animation.
                      </p>
                    </Card>
                  </div>

                  {/* Clickable Card */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Clickable Card</h3>
                    <Card 
                      hover 
                      onClick={() => alert('Card clicked!')}
                      padding="md"
                    >
                      <h4 className="text-white font-semibold mb-2">Click Me!</h4>
                      <p className="text-slate-400 text-sm">
                        This card is clickable and will show an alert.
                      </p>
                    </Card>
                  </div>

                  {/* Different Padding */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Padding Variants</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card padding="sm">
                        <p className="text-white text-sm">Small Padding</p>
                      </Card>
                      <Card padding="md">
                        <p className="text-white text-sm">Medium Padding</p>
                      </Card>
                      <Card padding="lg">
                        <p className="text-white text-sm">Large Padding</p>
                      </Card>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges">
            <Card>
              <h2 className="text-2xl font-bold text-white mb-6">Badges</h2>
              
              <div className="space-y-8">
                {/* Variants */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Variants</h3>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="error">Error</Badge>
                    <Badge variant="info">Info</Badge>
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Sizes</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge size="sm">Small</Badge>
                    <Badge size="md">Medium</Badge>
                    <Badge size="lg">Large</Badge>
                  </div>
                </div>

                {/* Use Cases */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Use Cases</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-white">Model Status:</span>
                      <Badge variant="success">Active</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white">Debate Status:</span>
                      <Badge variant="warning">In Progress</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white">Fact Check:</span>
                      <Badge variant="error">Failed</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white">Provider:</span>
                      <Badge variant="info">OpenAI</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <Card>
              <h2 className="text-2xl font-bold text-white mb-6">Alerts</h2>
              
              <div className="space-y-6">
                {/* Info Alert */}
                <Alert variant="info" title="Information">
                  This is an informational alert. It provides helpful context to the user.
                </Alert>

                {/* Success Alert */}
                <Alert variant="success" title="Success!">
                  Your debate has been created successfully and is now in progress.
                </Alert>

                {/* Warning Alert */}
                <Alert variant="warning" title="Warning">
                  This model has a high controversy score. Results may vary significantly.
                </Alert>

                {/* Error Alert */}
                <Alert variant="error" title="Error">
                  Failed to load debate data. Please try again or contact support.
                </Alert>

                {/* Dismissible Alert */}
                {showAlert && (
                  <Alert 
                    variant="info" 
                    title="Dismissible Alert"
                    onClose={() => setShowAlert(false)}
                  >
                    This alert can be dismissed by clicking the X button.
                  </Alert>
                )}
                {!showAlert && (
                  <Button onClick={() => setShowAlert(true)} size="sm">
                    Show Dismissible Alert
                  </Button>
                )}

                {/* Alert without title */}
                <Alert variant="success">
                  This is an alert without a title. Just the message content.
                </Alert>
              </div>
            </Card>
          </TabsContent>

          {/* Loading Tab */}
          <TabsContent value="loading">
            <Card>
              <h2 className="text-2xl font-bold text-white mb-6">Loading States</h2>
              
              <div className="space-y-8">
                {/* Loading Spinners */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Loading Spinners</h3>
                  <div className="flex flex-wrap items-center gap-8">
                    <div className="text-center">
                      <LoadingSpinner size="sm" />
                      <p className="text-slate-400 text-sm mt-2">Small</p>
                    </div>
                    <div className="text-center">
                      <LoadingSpinner size="md" />
                      <p className="text-slate-400 text-sm mt-2">Medium</p>
                    </div>
                    <div className="text-center">
                      <LoadingSpinner size="lg" />
                      <p className="text-slate-400 text-sm mt-2">Large</p>
                    </div>
                  </div>
                </div>

                {/* With Text */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">With Text</h3>
                  <LoadingSpinner size="md" text="Loading debate..." />
                </div>

                {/* Skeleton Loaders */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Skeleton Loaders</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-slate-400 text-sm mb-2">Text Skeleton</p>
                      <Skeleton variant="text" className="w-full" />
                      <Skeleton variant="text" className="w-3/4 mt-2" />
                      <Skeleton variant="text" className="w-1/2 mt-2" />
                    </div>
                    
                    <div>
                      <p className="text-slate-400 text-sm mb-2">Circular Skeleton</p>
                      <Skeleton variant="circular" className="w-16 h-16" />
                    </div>
                    
                    <div>
                      <p className="text-slate-400 text-sm mb-2">Rectangular Skeleton</p>
                      <Skeleton variant="rectangular" className="w-full h-32" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </Container>
    </div>
  )
}
