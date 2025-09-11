'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/currency'
import { Users, GraduationCap, Heart, Building, Briefcase, Check, Star } from 'lucide-react'

export interface BudgetTemplate {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  totalBudget: number
  categories: {
    [categoryId: string]: number
  }
  tags: string[]
}

export const BUDGET_TEMPLATES: BudgetTemplate[] = [
  {
    id: 'student',
    name: 'Étudiant',
    description: 'Budget optimisé pour la vie étudiante avec priorité sur l\'essentiel',
    icon: GraduationCap,
    totalBudget: 800,
    categories: {
      'daily': 150,      // Vie quotidienne (courses, etc.)
      'leisure': 100,    // Loisirs & sorties
      'education': 50,   // Éducation & famille
      'subscriptions': 30, // Abonnements & téléphonie
      'health': 40,      // Santé
      'auto': 80,        // Auto/transport
      'housing': 350,    // Logement (part étudiante)
      'other': 50        // Autres dépenses
    },
    tags: ['Économique', 'Essentiel', 'Transport en commun']
  },
  {
    id: 'family',
    name: 'Famille',
    description: 'Budget familial équilibré avec enfants et dépenses variées',
    icon: Users,
    totalBudget: 3500,
    categories: {
      'daily': 600,        // Vie quotidienne (courses familiales)
      'housing': 1200,     // Logement
      'auto': 300,         // Auto
      'education': 200,    // Éducation & famille
      'health': 150,       // Santé
      'leisure': 250,      // Loisirs & sorties
      'subscriptions': 80, // Abonnements & téléphonie
      'services': 100,     // Services financiers & professionnels
      'gifts': 100,        // Cadeaux & solidarité
      'savings': 300,      // Épargne
      'other': 100,        // Autres dépenses
      'taxes': 120         // Impôts & taxes
    },
    tags: ['Équilibré', 'Enfants', 'Épargne']
  },
  {
    id: 'couple',
    name: 'Couple',
    description: 'Budget pour couple actif sans enfants, lifestyle moderne',
    icon: Heart,
    totalBudget: 2800,
    categories: {
      'daily': 400,        // Vie quotidienne
      'housing': 1000,     // Logement
      'auto': 250,         // Auto
      'leisure': 300,      // Loisirs & sorties
      'travel': 200,       // Voyages
      'health': 120,       // Santé
      'subscriptions': 60, // Abonnements & téléphonie
      'services': 80,      // Services financiers & professionnels
      'gifts': 80,         // Cadeaux & solidarité
      'savings': 250,      // Épargne
      'other': 80          // Autres dépenses
    },
    tags: ['Moderne', 'Voyages', 'Lifestyle']
  },
  {
    id: 'senior',
    name: 'Retraité',
    description: 'Budget adapté aux retraités avec focus santé et loisirs',
    icon: Building,
    totalBudget: 2200,
    categories: {
      'daily': 300,        // Vie quotidienne
      'housing': 800,      // Logement
      'health': 200,       // Santé (priorité)
      'leisure': 200,      // Loisirs & sorties
      'travel': 150,       // Voyages
      'auto': 120,         // Auto (moins d'usage)
      'subscriptions': 50, // Abonnements & téléphonie
      'services': 100,     // Services financiers & professionnels
      'gifts': 120,        // Cadeaux & solidarité
      'taxes': 100,        // Impôts & taxes
      'other': 60          // Autres dépenses
    },
    tags: ['Santé', 'Confort', 'Stabilité']
  },
  {
    id: 'professional',
    name: 'Jeune actif',
    description: 'Budget pour professionnel urbain, équilibre travail-vie',
    icon: Briefcase,
    totalBudget: 2500,
    categories: {
      'daily': 350,        // Vie quotidienne
      'housing': 900,      // Logement
      'auto': 200,         // Auto/transport
      'leisure': 250,      // Loisirs & sorties
      'subscriptions': 70, // Abonnements & téléphonie
      'health': 100,       // Santé
      'services': 100,     // Services financiers & professionnels
      'travel': 150,       // Voyages
      'savings': 200,      // Épargne
      'education': 50,     // Formation continue
      'other': 100,        // Autres dépenses
      'taxes': 80          // Impôts & taxes
    },
    tags: ['Urbain', 'Carrière', 'Équilibre']
  }
]

interface BudgetTemplatesProps {
  onApplyTemplate: (template: BudgetTemplate) => Promise<void>
  disabled?: boolean
}

export function BudgetTemplates({ onApplyTemplate, disabled }: BudgetTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [isApplying, setIsApplying] = useState(false)

  const handleApplyTemplate = async (template: BudgetTemplate) => {
    try {
      setIsApplying(true)
      setSelectedTemplate(template.id)
      await onApplyTemplate(template)
    } catch (error) {
      console.error('Error applying template:', error)
    } finally {
      setIsApplying(false)
      setSelectedTemplate(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Star className="h-5 w-5 text-yellow-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Modèles de budget
        </h3>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Utilisez un modèle prédéfini comme point de départ, puis ajustez selon vos besoins.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BUDGET_TEMPLATES.map((template) => {
          const IconComponent = template.icon
          const isSelected = selectedTemplate === template.id
          const categoryCount = Object.keys(template.categories).length

          return (
            <Card key={template.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 mr-3">
                  <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {template.name}
                  </h4>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(template.totalBudget)}
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {template.description}
              </p>

              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {categoryCount} catégories configurées
              </div>

              <Button
                onClick={() => handleApplyTemplate(template)}
                disabled={disabled || isApplying}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className="w-full"
              >
                {isSelected && isApplying ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Application...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Check className="h-4 w-4 mr-2" />
                    Appliquer ce modèle
                  </div>
                )}
              </Button>
            </Card>
          )
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start">
          <div className="text-2xl mr-3">💡</div>
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Conseil
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Ces modèles sont des suggestions basées sur des profils types. 
              N'hésitez pas à les adapter à votre situation personnelle après application.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}