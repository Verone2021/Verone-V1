'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Constants identiques à ceux du UniteForm
const UNITE_TYPES = [
  { value: 'studio', label: 'Studio' },
  { value: 't1', label: 'T1' },
  { value: 't2', label: 'T2' },
  { value: 't3', label: 'T3' },
  { value: 't4', label: 'T4' },
  { value: 't5', label: 'T5+' },
  { value: 'chambre', label: 'Chambre' },
  { value: 'suite', label: 'Suite' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'loft', label: 'Loft' },
]

// Schéma de test simple
const testFormSchema = z.object({
  type: z.string().optional(),
})

type TestFormData = z.infer<typeof testFormSchema>

export default function TestDropdownPage() {
  const [selectedValue, setSelectedValue] = useState<string>('')
  const [formData, setFormData] = useState<TestFormData | null>(null)

  const form = useForm<TestFormData>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      type: '',
    },
  })

  const onSubmit = (data: TestFormData) => {
    setFormData(data)
    console.log('Form submitted:', data)
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Test du Dropdown Unite Types - FIXED</CardTitle>
          <CardDescription>
            Test avec hardcoded SelectItems (comme dans unite-form.tsx)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations de debug */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">🔍 Informations de debug :</h3>
            <p><strong>UNITE_TYPES.length:</strong> {UNITE_TYPES.length}</p>
            <p><strong>Valeur sélectionnée:</strong> {selectedValue || 'Aucune'}</p>
            <p><strong>Form watch type:</strong> {form.watch('type') || 'Aucune'}</p>
          </div>

          {/* Test du Select avec React Hook Form - HARDCODED VERSION */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type d'unité (HARDCODED - Should Work)</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value)
                        setSelectedValue(value)
                        console.log('Hook Form onChange:', value)
                      }} 
                      value={field.value || ""}
                      defaultValue={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="studio">Studio</SelectItem>
                        <SelectItem value="t1">T1</SelectItem>
                        <SelectItem value="t2">T2</SelectItem>
                        <SelectItem value="t3">T3</SelectItem>
                        <SelectItem value="t4">T4</SelectItem>
                        <SelectItem value="t5">T5+</SelectItem>
                        <SelectItem value="chambre">Chambre</SelectItem>
                        <SelectItem value="suite">Suite</SelectItem>
                        <SelectItem value="duplex">Duplex</SelectItem>
                        <SelectItem value="loft">Loft</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit">Tester la soumission</Button>
            </form>
          </Form>

          {/* Test du Select simple (sans form) - HARDCODED VERSION */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium mb-2">
              Type d'unité (Select simple, sans form - HARDCODED)
            </label>
            <Select onValueChange={(value) => {
              setSelectedValue(value)
              console.log('Simple onChange:', value)
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le type (simple)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="t1">T1</SelectItem>
                <SelectItem value="t2">T2</SelectItem>
                <SelectItem value="t3">T3</SelectItem>
                <SelectItem value="t4">T4</SelectItem>
                <SelectItem value="t5">T5+</SelectItem>
                <SelectItem value="chambre">Chambre</SelectItem>
                <SelectItem value="suite">Suite</SelectItem>
                <SelectItem value="duplex">Duplex</SelectItem>
                <SelectItem value="loft">Loft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Résultats du test */}
          {formData && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">✅ Résultat du test :</h3>
              <pre>{JSON.stringify(formData, null, 2)}</pre>
            </div>
          )}

          {/* OLD BROKEN VERSION pour comparison */}
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">❌ Version cassée (mapping dynamique) :</h3>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Cette version ne fonctionne pas" />
              </SelectTrigger>
              <SelectContent>
                {UNITE_TYPES.map((type) => {
                  console.log('Broken version - Rendering SelectItem:', type)
                  return (
                    <SelectItem key={`broken-${type.value}`} value={type.value}>
                      {type.label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
