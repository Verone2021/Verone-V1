'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ContratFormTest() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Test Contract Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label htmlFor="test-input">Test Input</label>
            <Input id="test-input" placeholder="Test input field" />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-copper hover:bg-copper-dark"
            >
              {loading ? 'Saving...' : 'Save Contract'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}