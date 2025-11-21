'use client'

import { useState } from 'react'
import { Share2, Twitter, Facebook, Linkedin, Mail, Link2, Check } from 'lucide-react'

interface ShareButtonsProps {
  debateId: string
  title?: string
  compact?: boolean
}

export function ShareButtons({ debateId, title = 'Share this debate', compact = false }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [shareData, setShareData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const loadShareData = async () => {
    if (shareData) return shareData

    setLoading(true)
    try {
      const response = await fetch(`/api/debates/${debateId}/share`)
      const data = await response.json()
      setShareData(data)
      return data
    } catch (error) {
      console.error('Failed to load share data:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async (platform: string) => {
    const data = await loadShareData()
    if (!data) return

    const url = data.shareUrls[platform]
    if (url) {
      window.open(url, '_blank', 'width=600,height=400')
    }
  }

  const handleCopyLink = async () => {
    const data = await loadShareData()
    if (!data) return

    try {
      await navigator.clipboard.writeText(data.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const handleNativeShare = async () => {
    const data = await loadShareData()
    if (!data) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: data.description,
          url: data.url,
        })
      } catch (error) {
        // User cancelled or share failed
        console.log('Share cancelled or failed:', error)
      }
    } else {
      // Fallback to copy link
      handleCopyLink()
    }
  }

  if (compact) {
    return (
      <button
        onClick={handleNativeShare}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      
      <div className="flex flex-wrap gap-2">
        {/* Twitter */}
        <button
          onClick={() => handleShare('twitter')}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1DA1F2] rounded-md hover:bg-[#1a8cd8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1DA1F2] disabled:opacity-50"
          title="Share on Twitter"
        >
          <Twitter className="w-4 h-4" />
          <span className="hidden sm:inline">Twitter</span>
        </button>

        {/* Facebook */}
        <button
          onClick={() => handleShare('facebook')}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1877F2] rounded-md hover:bg-[#166fe5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1877F2] disabled:opacity-50"
          title="Share on Facebook"
        >
          <Facebook className="w-4 h-4" />
          <span className="hidden sm:inline">Facebook</span>
        </button>

        {/* LinkedIn */}
        <button
          onClick={() => handleShare('linkedin')}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0A66C2] rounded-md hover:bg-[#095196] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A66C2] disabled:opacity-50"
          title="Share on LinkedIn"
        >
          <Linkedin className="w-4 h-4" />
          <span className="hidden sm:inline">LinkedIn</span>
        </button>

        {/* Email */}
        <button
          onClick={() => handleShare('email')}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          title="Share via Email"
        >
          <Mail className="w-4 h-4" />
          <span className="hidden sm:inline">Email</span>
        </button>

        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          title="Copy Link"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span className="hidden sm:inline text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4" />
              <span className="hidden sm:inline">Copy Link</span>
            </>
          )}
        </button>
      </div>

      {/* Native Share (Mobile) */}
      {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
        <button
          onClick={handleNativeShare}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 sm:hidden"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      )}
    </div>
  )
}
