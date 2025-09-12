CODE GUIDE VISUEL WANT IT NOW

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";  
import { Separator } from "@/components/ui/separator";  
import { Input } from "@/components/ui/input";  
import { Label } from "@/components/ui/label";  
import { Textarea } from "@/components/ui/textarea";  
import { Button } from "@/components/ui/button";  
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";  
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";  
import { Badge } from "@/components/ui/badge";  
import { BadgeWithIcon } from "@/components/ui/badge-with-icon";  
import { AvatarBadge } from "@/components/ui/avatar-badge";  
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";  
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";  
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";  
import { Skeleton } from "@/components/ui/skeleton";  
import { Progress } from "@/components/ui/progress";  
import { Switch } from "@/components/ui/switch";  
import { Checkbox } from "@/components/ui/checkbox";  
import { Home, Building, TrendingUp, AlertCircle, CheckCircle2, User, Mail, Phone, MapPin, Calendar, Filter, Search, Eye, Edit, Trash2, Plus, Download, Bell, X, Info, AlertTriangle, ChevronRight, ChevronLeft, ChevronDown, MoreHorizontal, Loader2, FileX, Smartphone, Globe, Palette, Layout, Settings, CreditCard, Users, Lightbulb, Clock, Star, BarChart3, PieChart, Activity, BookOpen, Award, Shield, TrendingDown, BookmarkIcon, CalendarIcon, Building2, ArrowRight, ArrowLeft, Check } from "lucide-react";  
import Header from "@/components/navigation/header";  
import { SidebarItem, SidebarItemGroup } from "@/components/navigation/sidebar-item";  
import { DashboardSidebar } from "@/components/navigation/dashboard-sidebar";  
import { SidebarProvider } from "@/components/ui/sidebar";  
import CreateOrganizationModal from "@/app/dashboard/organizations/components/CreateOrganizationModal";  
import CreateOwnerModal from "@/app/dashboard/owners/components/CreateOwnerModal";

export default function StyleGuidePage() {  
  return (  
    \<SidebarProvider\>  
      \<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100"\>  
        \<Header currentPage="style-guide" /\>  
        
      \<div className="max-w-7xl mx-auto px-6 py-12"\>  
        {/\* Titre Principal avec Design Moderne \*/}  
        \<div className="text-center mb-16 relative"\>  
          {/\* Background Gradient \*/}  
          \<div className="absolute inset-0 bg-gradient-to-br from-\[\#D4841A\]/5 via-transparent to-\[\#2D5A27\]/5 rounded-3xl \-z-10"\>\</div\>  
            
          \<div className="relative pt-12 pb-8"\>  
            {/\* Logo Animé \*/}  
            \<div className="flex justify-center mb-6"\>  
              \<div className="relative w-16 h-16"\>  
                \<div className="absolute inset-0 bg-\[\#D4841A\] rounded-2xl transform rotate-45 origin-center opacity-80 animate-pulse"\>\</div\>  
                \<div className="absolute inset-0 bg-\[\#2D5A27\] rounded-2xl transform \-rotate-45 origin-center animate-pulse"\>\</div\>  
              \</div\>  
            \</div\>  
              
            \<h1 className="text-6xl font-bold bg-gradient-to-r from-\[\#D4841A\] to-\[\#2D5A27\] bg-clip-text text-transparent mb-4"\>  
              Want It Now  
            \</h1\>  
            \<h2 className="text-2xl font-semibold text-gray-800 mb-4"\>Guide de Style & Design System\</h2\>  
            \<p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed"\>  
              Système de design complet avec composants réels, navigation authentique, modals wizards et écosystème booking avancé.  
            \</p\>  
              
            {/\* Badges Avancés \*/}  
            \<div className="mt-8 flex flex-wrap items-center justify-center gap-3"\>  
              \<div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-50 to-green-100 rounded-full border border-green-200"\>  
                \<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"\>\</div\>  
                \<span className="text-sm font-medium text-green-800"\>✅ Navigation Réelle Intégrée\</span\>  
              \</div\>  
              \<div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-full border border-blue-200"\>  
                \<div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"\>\</div\>  
                \<span className="text-sm font-medium text-blue-800"\>🎨 Modals Wizards Multi-étapes\</span\>  
              \</div\>  
              \<div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-purple-100 rounded-full border border-purple-200"\>  
                \<div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"\>\</div\>  
                \<span className="text-sm font-medium text-purple-800"\>⚡ États Interactifs Complets\</span\>  
              \</div\>  
              \<div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-\[\#D4841A\]/10 to-\[\#2D5A27\]/10 rounded-full border border-\[\#D4841A\]/20"\>  
                \<div className="w-2 h-2 bg-gradient-to-r from-\[\#D4841A\] to-\[\#2D5A27\] rounded-full animate-pulse"\>\</div\>  
                \<span className="text-sm font-medium text-gray-800"\>🚀 Design System Avancé\</span\>  
              \</div\>  
            \</div\>  
          \</div\>  
        \</div\>

        {/\* Navigation Rapide Améliorée \*/}  
        \<div className="mb-12"\>  
          \<Card className="bg-white modern-shadow border-0 overflow-hidden"\>  
            \<CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b"\>  
              \<CardTitle className="flex items-center space-x-3"\>  
                \<div className="w-8 h-8 bg-gradient-to-r from-\[\#D4841A\] to-\[\#2D5A27\] rounded-lg flex items-center justify-center"\>  
                  \<Layout className="w-4 h-4 text-white" /\>  
                \</div\>  
                \<span className="text-lg"\>Navigation Rapide\</span\>  
              \</CardTitle\>  
            \</CardHeader\>  
            \<CardContent className="p-6"\>  
              \<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"\>  
                \<a href="\#colors" className="group p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 transition-all duration-300 transform hover:scale-105 hover:shadow-lg border border-orange-200/50"\>  
                  \<div className="flex items-center space-x-3"\>  
                    \<div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"\>  
                      \<Palette className="w-5 h-5 text-white" /\>  
                    \</div\>  
                    \<div\>  
                      \<p className="font-semibold text-orange-800"\>Couleurs\</p\>  
                      \<p className="text-xs text-orange-600"\>Palettes & Gradients\</p\>  
                    \</div\>  
                  \</div\>  
                \</a\>  
                  
                \<a href="\#components" className="group p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 transform hover:scale-105 hover:shadow-lg border border-blue-200/50"\>  
                  \<div className="flex items-center space-x-3"\>  
                    \<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"\>  
                      \<Layout className="w-5 h-5 text-white" /\>  
                    \</div\>  
                    \<div\>  
                      \<p className="font-semibold text-blue-800"\>Composants\</p\>  
                      \<p className="text-xs text-blue-600"\>UI & Interactions\</p\>  
                    \</div\>  
                  \</div\>  
                \</a\>  
                  
                \<a href="\#kpi-cards" className="group p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all duration-300 transform hover:scale-105 hover:shadow-lg border border-green-200/50"\>  
                  \<div className="flex items-center space-x-3"\>  
                    \<div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"\>  
                      \<TrendingUp className="w-5 h-5 text-white" /\>  
                    \</div\>  
                    \<div\>  
                      \<p className="font-semibold text-green-800"\>KPI Cards\</p\>  
                      \<p className="text-xs text-green-600"\>Métriques Pro\</p\>  
                    \</div\>  
                  \</div\>  
                \</a\>  
                  
                \<a href="\#hooks" className="group p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all duration-300 transform hover:scale-105 hover:shadow-lg border border-purple-200/50"\>  
                  \<div className="flex items-center space-x-3"\>  
                    \<div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"\>  
                      \<Settings className="w-5 h-5 text-white" /\>  
                    \</div\>  
                    \<div\>  
                      \<p className="font-semibold text-purple-800"\>Hooks\</p\>  
                      \<p className="text-xs text-purple-600"\>Logic & State\</p\>  
                    \</div\>  
                  \</div\>  
                \</a\>  
                  
                \<a href="\#navigation" className="group p-4 rounded-xl bg-gradient-to-br from-\[\#D4841A\]/10 to-\[\#2D5A27\]/10 hover:from-\[\#D4841A\]/20 hover:to-\[\#2D5A27\]/20 transition-all duration-300 transform hover:scale-105 hover:shadow-lg border border-\[\#D4841A\]/20"\>  
                  \<div className="flex items-center space-x-3"\>  
                    \<div className="w-10 h-10 bg-gradient-to-r from-\[\#D4841A\] to-\[\#2D5A27\] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"\>  
                      \<Building className="w-5 h-5 text-white" /\>  
                    \</div\>  
                    \<div\>  
                      \<p className="font-semibold text-gray-800"\>Navigation\</p\>  
                      \<p className="text-xs text-gray-600"\>Sidebar & Modals\</p\>  
                    \</div\>  
                  \</div\>  
                \</a\>  
              \</div\>  
            \</CardContent\>  
          \</Card\>  
        \</div\>

        {/\* Palette de Couleurs \*/}  
        \<section id="colors" className="mb-20"\>  
          \<h2 className="text-3xl font-bold text-gray-900 mb-8 text-spacing"\>🎨 Palette de Couleurs Want It Now\</h2\>  
            
          \<div className="grid grid-cols-1 lg:grid-cols-2 gap-8"\>  
            {/\* Couleurs Primaires avec Gradients \*/}  
            \<div className="bg-white rounded-large p-8 modern-shadow"\>  
              \<h3 className="text-xl font-semibold text-gray-900 mb-6"\>Couleurs Primaires Want It Now\</h3\>  
              \<div className="space-y-6"\>  
                {/\* Copper System \*/}  
                \<div className="space-y-3"\>  
                  \<h4 className="font-medium text-\[\#D4841A\] mb-2"\>Système Copper\</h4\>  
                  \<div className="grid grid-cols-2 gap-4"\>  
                    \<div className="flex items-center space-x-3"\>  
                      \<div className="w-12 h-12 bg-\[\#D4841A\] rounded-lg modern-shadow"\>\</div\>  
                      \<div\>  
                        \<p className="font-medium text-gray-900"\>Copper\</p\>  
                        \<p className="text-xs text-gray-500"\>\#D4841A\</p\>  
                      \</div\>  
                    \</div\>  
                    \<div className="flex items-center space-x-3"\>  
                      \<div className="w-12 h-12 bg-gradient-to-r from-\[\#D4841A\] to-\[\#B8741A\] rounded-lg modern-shadow"\>\</div\>  
                      \<div\>  
                        \<p className="font-medium text-gray-900"\>Gradient\</p\>  
                        \<p className="text-xs text-gray-500"\>Actions hover\</p\>  
                      \</div\>  
                    \</div\>  
                  \</div\>  
                  \<div className="p-3 bg-gradient-to-r from-\[\#D4841A\]/10 to-\[\#D4841A\]/20 rounded-lg border border-\[\#D4841A\]/20"\>  
                    \<p className="text-sm text-\[\#D4841A\] font-medium"\>Usage : Boutons primaires, CTA, badges actifs, accents\</p\>  
                  \</div\>  
                \</div\>

                {/\* Green System \*/}  
                \<div className="space-y-3"\>  
                  \<h4 className="font-medium text-\[\#2D5A27\] mb-2"\>Système Green\</h4\>  
                  \<div className="grid grid-cols-2 gap-4"\>  
                    \<div className="flex items-center space-x-3"\>  
                      \<div className="w-12 h-12 bg-\[\#2D5A27\] rounded-lg modern-shadow"\>\</div\>  
                      \<div\>  
                        \<p className="font-medium text-gray-900"\>Green\</p\>  
                        \<p className="text-xs text-gray-500"\>\#2D5A27\</p\>  
                      \</div\>  
                    \</div\>  
                    \<div className="flex items-center space-x-3"\>  
                      \<div className="w-12 h-12 bg-gradient-to-r from-\[\#2D5A27\] to-\[\#1F3F1C\] rounded-lg modern-shadow"\>\</div\>  
                      \<div\>  
                        \<p className="font-medium text-gray-900"\>Gradient\</p\>  
                        \<p className="text-xs text-gray-500"\>Navigation hover\</p\>  
                      \</div\>  
                    \</div\>  
                  \</div\>  
                  \<div className="p-3 bg-gradient-to-r from-\[\#2D5A27\]/10 to-\[\#2D5A27\]/20 rounded-lg border border-\[\#2D5A27\]/20"\>  
                    \<p className="text-sm text-\[\#2D5A27\] font-medium"\>Usage : Navigation, succès, confirmation, avatars\</p\>  
                  \</div\>  
                \</div\>

                {/\* Gradients Combinés \*/}  
                \<div className="space-y-3"\>  
                  \<h4 className="font-medium text-gray-900 mb-2"\>Gradients Signature\</h4\>  
                  \<div className="grid grid-cols-1 gap-3"\>  
                    \<div className="h-16 bg-gradient-to-r from-\[\#D4841A\] to-\[\#2D5A27\] rounded-lg modern-shadow flex items-center justify-center"\>  
                      \<span className="text-white font-semibold"\>Copper → Green\</span\>  
                    \</div\>  
                    \<div className="h-16 bg-gradient-to-br from-\[\#D4841A\]/20 via-transparent to-\[\#2D5A27\]/20 rounded-lg border border-gray-200 flex items-center justify-center"\>  
                      \<span className="text-gray-700 font-medium"\>Subtle Brand Gradient\</span\>  
                    \</div\>  
                  \</div\>  
                \</div\>  
              \</div\>  
            \</div\>

            {/\* Couleurs Plateformes avec Badges \*/}  
            \<div className="bg-white rounded-large p-8 modern-shadow"\>  
              \<h3 className="text-xl font-semibold text-gray-900 mb-6"\>Couleurs Plateformes Booking\</h3\>  
              \<div className="space-y-4"\>  
                \<div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"\>  
                  \<div className="flex items-center space-x-3"\>  
                    \<div className="w-10 h-10 bg-\[\#FF5A5F\] rounded-lg modern-shadow flex items-center justify-center"\>  
                      \<span className="text-white font-bold text-xs"\>Ab\</span\>  
                    \</div\>  
                    \<div\>  
                      \<p className="font-medium text-gray-900"\>Airbnb\</p\>  
                      \<p className="text-xs text-gray-500"\>\#FF5A5F\</p\>  
                    \</div\>  
                  \</div\>  
                  \<Badge className="bg-\[\#FF5A5F\]/10 text-\[\#FF5A5F\] border-\[\#FF5A5F\]/20"\>Platform\</Badge\>  
                \</div\>  
                  
                \<div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"\>  
                  \<div className="flex items-center space-x-3"\>  
                    \<div className="w-10 h-10 bg-\[\#003580\] rounded-lg modern-shadow flex items-center justify-center"\>  
                      \<span className="text-white font-bold text-xs"\>Bk\</span\>  
                    \</div\>  
                    \<div\>  
                      \<p className="font-medium text-gray-900"\>Booking.com\</p\>  
                      \<p className="text-xs text-gray-500"\>\#003580\</p\>  
                    \</div\>  
                  \</div\>  
                  \<Badge className="bg-\[\#003580\]/10 text-\[\#003580\] border-\[\#003580\]/20"\>Platform\</Badge\>  
                \</div\>  
                  
                \<div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"\>  
                  \<div className="flex items-center space-x-3"\>  
                    \<div className="w-10 h-10 bg-\[\#0073CF\] rounded-lg modern-shadow flex items-center justify-center"\>  
                      \<span className="text-white font-bold text-xs"\>Vr\</span\>  
                    \</div\>  
                    \<div\>  
                      \<p className="font-medium text-gray-900"\>VRBO\</p\>  
                      \<p className="text-xs text-gray-500"\>\#0073CF\</p\>  
                    \</div\>  
                  \</div\>  
                  \<Badge className="bg-\[\#0073CF\]/10 text-\[\#0073CF\] border-\[\#0073CF\]/20"\>Platform\</Badge\>  
                \</div\>  
                  
                \<div className="flex items-center justify-between p-3 rounded-lg border border-\[\#D4841A\]/20 bg-gradient-to-r from-\[\#D4841A\]/5 to-\[\#D4841A\]/10 transition-all"\>  
                  \<div className="flex items-center space-x-3"\>  
                    \<div className="w-10 h-10 bg-gradient-to-r from-\[\#D4841A\] to-\[\#B8741A\] rounded-lg modern-shadow flex items-center justify-center"\>  
                      \<span className="text-white font-bold text-xs"\>W\</span\>  
                    \</div\>  
                    \<div\>  
                      \<p className="font-medium text-gray-900"\>Direct\</p\>  
                      \<p className="text-xs text-gray-500"\>\#D4841A (Brand)\</p\>  
                    \</div\>  
                  \</div\>  
                  \<Badge className="bg-\[\#D4841A\] text-white"\>Primary\</Badge\>  
                \</div\>  
              \</div\>  
            \</div\>

            {/\* Couleurs d'États \*/}  
            \<div className="bg-white rounded-large p-8 modern-shadow"\>  
              \<h3 className="text-xl font-semibold text-gray-900 mb-6"\>Couleurs d\&apos;État\</h3\>  
              \<div className="grid grid-cols-2 gap-4"\>  
                \<div className="text-center"\>  
                  \<div className="w-12 h-12 bg-green-500 rounded-lg mx-auto mb-2"\>\</div\>  
                  \<p className="text-sm font-medium"\>Succès\</p\>  
                  \<p className="text-xs text-gray-500"\>\#10b981\</p\>  
                \</div\>  
                \<div className="text-center"\>  
                  \<div className="w-12 h-12 bg-red-500 rounded-lg mx-auto mb-2"\>\</div\>  
                  \<p className="text-sm font-medium"\>Erreur\</p\>  
                  \<p className="text-xs text-gray-500"\>\#ef4444\</p\>  
                \</div\>  
                \<div className="text-center"\>  
                  \<div className="w-12 h-12 bg-yellow-500 rounded-lg mx-auto mb-2"\>\</div\>  
                  \<p className="text-sm font-medium"\>Warning\</p\>  
                  \<p className="text-xs text-gray-500"\>\#f59e0b\</p\>  
                \</div\>  
                \<div className="text-center"\>  
                  \<div className="w-12 h-12 bg-blue-500 rounded-lg mx-auto mb-2"\>\</div\>  
                  \<p className="text-sm font-medium"\>Info\</p\>  
                  \<p className="text-xs text-gray-500"\>\#3b82f6\</p\>  
                \</div\>  
              \</div\>  
            \</div\>

            {/\* Couleurs Statuts Booking \*/}  
            \<div className="bg-white rounded-large p-8 modern-shadow"\>  
              \<h3 className="text-xl font-semibold text-gray-900 mb-6"\>Statuts Réservations\</h3\>  
              \<div className="space-y-3"\>  
                \<div className="flex items-center space-x-3"\>  
                  \<Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"\>Pending\</Badge\>  
                  \<span className="text-sm text-gray-600"\>En attente de confirmation\</span\>  
                \</div\>  
                \<div className="flex items-center space-x-3"\>  
                  \<Badge className="bg-green-100 text-green-800 border-green-200"\>Confirmed\</Badge\>  
                  \<span className="text-sm text-gray-600"\>Confirmée\</span\>  
                \</div\>  
                \<div className="flex items-center space-x-3"\>  
                  \<Badge className="bg-blue-100 text-blue-800 border-blue-200"\>Checked In\</Badge\>  
                  \<span className="text-sm text-gray-600"\>Arrivée effectuée\</span\>  
                \</div\>  
                \<div className="flex items-center space-x-3"\>  
                  \<Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"\>Completed\</Badge\>  
                  \<span className="text-sm text-gray-600"\>Séjour terminé\</span\>  
                \</div\>  
                \<div className="flex items-center space-x-3"\>  
                  \<Badge className="bg-red-100 text-red-800 border-red-200"\>Cancelled\</Badge\>  
                  \<span className="text-sm text-gray-600"\>Annulée\</span\>  
                \</div\>  
              \</div\>  
            \</div\>  
          \</div\>  
        \</section\>

        {/\* Composants UI Base \*/}  
        \<section id="components" className="mb-20"\>  
          \<h2 className="text-3xl font-bold text-gray-900 mb-8 text-spacing"\>🧩 Composants UI de Base\</h2\>  
            
          \<Tabs defaultValue="buttons" className="w-full"\>  
            \<TabsList className="grid w-full grid-cols-6"\>  
              \<TabsTrigger value="buttons"\>Boutons\</TabsTrigger\>  
              \<TabsTrigger value="forms"\>Formulaires\</TabsTrigger\>  
              \<TabsTrigger value="tables"\>Tableaux\</TabsTrigger\>  
              \<TabsTrigger value="alerts"\>Alertes\</TabsTrigger\>  
              \<TabsTrigger value="navigation"\>Navigation\</TabsTrigger\>  
              \<TabsTrigger value="feedback"\>Feedback\</TabsTrigger\>  
              \<TabsTrigger value="modals"\>Modals & Wizards\</TabsTrigger\>  
            \</TabsList\>

            \<TabsContent value="buttons" className="space-y-6"\>  
              \<Card\>  
                \<CardHeader\>  
                  \<CardTitle\>Boutons Want It Now\</CardTitle\>  
                \</CardHeader\>  
                \<CardContent className="space-y-6"\>  
                  \<div\>  
                    \<h4 className="font-semibold mb-3 text-\[\#D4841A\]"\>Boutons Want It Now\</h4\>  
                    \<div className="grid grid-cols-1 md:grid-cols-2 gap-6"\>  
                      {/\* Boutons Copper \*/}  
                      \<div className="space-y-3"\>  
                        \<h5 className="text-sm font-medium text-gray-700"\>Système Copper\</h5\>  
                        \<div className="space-y-2"\>  
                          \<Button className="w-full bg-\[\#D4841A\] hover:bg-\[\#B8741A\] text-white transition-all duration-200 shadow-sm hover:shadow-md"\>  
                            \<Plus className="w-4 h-4 mr-2" /\>  
                            Bouton Primary Copper  
                          \</Button\>  
                          \<Button variant="outline" className="w-full border-\[\#D4841A\] text-\[\#D4841A\] hover:bg-\[\#D4841A\] hover:text-white transition-all duration-200"\>  
                            \<Edit className="w-4 h-4 mr-2" /\>  
                            Outline Copper  
                          \</Button\>  
                          \<Button variant="ghost" className="w-full text-\[\#D4841A\] hover:bg-\[\#D4841A\]/10 transition-all duration-200"\>  
                            \<Eye className="w-4 h-4 mr-2" /\>  
                            Ghost Copper  
                          \</Button\>  
                        \</div\>  
                      \</div\>

                      {/\* Boutons Green \*/}  
                      \<div className="space-y-3"\>  
                        \<h5 className="text-sm font-medium text-gray-700"\>Système Green\</h5\>  
                        \<div className="space-y-2"\>  
                          \<Button className="w-full bg-\[\#2D5A27\] hover:bg-\[\#1F3F1C\] text-white transition-all duration-200 shadow-sm hover:shadow-md"\>  
                            \<CheckCircle2 className="w-4 h-4 mr-2" /\>  
                            Primary Green  
                          \</Button\>  
                          \<Button variant="outline" className="w-full border-\[\#2D5A27\] text-\[\#2D5A27\] hover:bg-\[\#2D5A27\] hover:text-white transition-all duration-200"\>  
                            \<Home className="w-4 h-4 mr-2" /\>  
                            Outline Green  
                          \</Button\>  
                          \<Button variant="ghost" className="w-full text-\[\#2D5A27\] hover:bg-\[\#2D5A27\]/10 transition-all duration-200"\>  
                            \<Settings className="w-4 h-4 mr-2" /\>  
                            Ghost Green  
                          \</Button\>  
                        \</div\>  
                      \</div\>  
                    \</div\>  
                  \</div\>

                  \<div\>  
                    \<h4 className="font-semibold mb-3"\>Boutons Actions\</h4\>  
                    \<div className="flex flex-wrap gap-4"\>  
                      \<Button size="sm" variant="outline"\>  
                        \<Eye className="w-4 h-4 mr-2" /\>  
                        Voir  
                      \</Button\>  
                      \<Button size="sm" variant="outline"\>  
                        \<Edit className="w-4 h-4 mr-2" /\>  
                        Modifier  
                      \</Button\>  
                      \<Button size="sm" variant="destructive"\>  
                        \<Trash2 className="w-4 h-4 mr-2" /\>  
                        Supprimer  
                      \</Button\>  
                      \<Button size="sm"\>  
                        \<Plus className="w-4 h-4 mr-2" /\>  
                        Ajouter  
                      \</Button\>  
                    \</div\>  
                  \</div\>

                  \<div\>  
                    \<h4 className="font-semibold mb-3 text-gray-900"\>États Interactifs\</h4\>  
                    \<div className="grid grid-cols-2 md:grid-cols-4 gap-3"\>  
                      {/\* État Loading \*/}  
                      \<div className="text-center"\>  
                        \<Button disabled className="w-full mb-2"\>  
                          \<Loader2 className="w-4 h-4 mr-2 animate-spin" /\>  
                          Loading  
                        \</Button\>  
                        \<span className="text-xs text-gray-500"\>Chargement\</span\>  
                      \</div\>  
                        
                      {/\* État Disabled \*/}  
                      \<div className="text-center"\>  
                        \<Button disabled variant="outline" className="w-full mb-2"\>  
                          Désactivé  
                        \</Button\>  
                        \<span className="text-xs text-gray-500"\>Disabled\</span\>  
                      \</div\>  
                        
                      {/\* État Success \*/}  
                      \<div className="text-center"\>  
                        \<Button className="w-full mb-2 bg-green-600 hover:bg-green-700"\>  
                          \<Check className="w-4 h-4 mr-2" /\>  
                          Succès  
                        \</Button\>  
                        \<span className="text-xs text-gray-500"\>Confirmation\</span\>  
                      \</div\>  
                        
                      {/\* État Destructive \*/}  
                      \<div className="text-center"\>  
                        \<Button variant="destructive" className="w-full mb-2"\>  
                          \<Trash2 className="w-4 h-4 mr-2" /\>  
                          Supprimer  
                        \</Button\>  
                        \<span className="text-xs text-gray-500"\>Destructive\</span\>  
                      \</div\>  
                    \</div\>  
                      
                    {/\* Gradient Buttons \*/}  
                    \<div className="mt-6 space-y-3"\>  
                      \<h5 className="text-sm font-medium text-gray-700"\>Boutons Gradient Signature\</h5\>  
                      \<div className="flex flex-wrap gap-3"\>  
                        \<Button className="bg-gradient-to-r from-\[\#D4841A\] to-\[\#2D5A27\] hover:from-\[\#B8741A\] hover:to-\[\#1F3F1C\] text-white shadow-lg hover:shadow-xl transition-all duration-300"\>  
                          \<Star className="w-4 h-4 mr-2" /\>  
                          Gradient Premium  
                        \</Button\>  
                        \<Button variant="outline" className="border-2 border-transparent bg-gradient-to-r from-\[\#D4841A\] to-\[\#2D5A27\] bg-clip-border text-transparent bg-clip-text hover:bg-white hover:text-\[\#D4841A\] transition-all duration-300"\>  
                          \<Award className="w-4 h-4 mr-2" /\>  
                          Outline Gradient  
                        \</Button\>  
                      \</div\>  
                    \</div\>  
                  \</div\>  
                \</CardContent\>  
              \</Card\>  
            \</TabsContent\>

            \<TabsContent value="forms" className="space-y-6"\>  
              \<Card\>  
                \<CardHeader\>  
                  \<CardTitle\>Éléments de Formulaire\</CardTitle\>  
                \</CardHeader\>  
                \<CardContent className="space-y-6"\>  
                  \<div className="grid grid-cols-1 md:grid-cols-2 gap-6"\>  
                    \<div className="space-y-4"\>  
                      \<div\>  
                        \<Label htmlFor="email"\>Email\</Label\>  
                        \<Input id="email" type="email" placeholder="exemple@domaine.com" /\>  
                      \</div\>  
                      \<div\>  
                        \<Label htmlFor="name"\>Nom complet\</Label\>  
                        \<Input id="name" placeholder="Jean Dupont" /\>  
                      \</div\>  
                      \<div\>  
                        \<Label htmlFor="message"\>Message\</Label\>  
                        \<Textarea id="message" placeholder="Votre message..." /\>  
                      \</div\>  
                    \</div\>  
                    \<div className="space-y-4"\>  
                      \<div\>  
                        \<Label htmlFor="select"\>Sélection\</Label\>  
                        \<Select\>  
                          \<SelectTrigger\>  
                            \<SelectValue placeholder="Choisir une option" /\>  
                          \</SelectTrigger\>  
                          \<SelectContent\>  
                            \<SelectItem value="option1"\>Option 1\</SelectItem\>  
                            \<SelectItem value="option2"\>Option 2\</SelectItem\>  
                            \<SelectItem value="option3"\>Option 3\</SelectItem\>  
                          \</SelectContent\>  
                        \</Select\>  
                      \</div\>  
                      \<div className="space-y-2"\>  
                        \<div className="flex items-center space-x-2"\>  
                          \<Checkbox id="terms" /\>  
                          \<Label htmlFor="terms"\>Accepter les conditions\</Label\>  
                        \</div\>  
                        \<div className="flex items-center space-x-2"\>  
                          \<Switch id="notifications" /\>  
                          \<Label htmlFor="notifications"\>Notifications activées\</Label\>  
                        \</div\>  
                      \</div\>  
                    \</div\>  
                  \</div\>  
                \</CardContent\>  
              \</Card\>  
            \</TabsContent\>

            \<TabsContent value="tables" className="space-y-6"\>  
              \<div className="grid grid-cols-1 gap-8"\>  
                {/\* Table Standard \*/}  
                \<Card\>  
                  \<CardHeader\>  
                    \<CardTitle className="flex items-center space-x-2"\>  
                      \<Table className="w-5 h-5" /\>  
                      \<span\>Tables Want It Now avec Filtres et Actions\</span\>  
                    \</CardTitle\>  
                    \<CardDescription\>  
                      Tables avancées avec tri, filtres, sélection multiple et actions en lot  
                    \</CardDescription\>  
                  \</CardHeader\>  
                  \<CardContent className="space-y-6"\>  
                    {/\* Barre d'outils table \*/}  
                    \<div className="flex items-center justify-between space-x-4"\>  
                      \<div className="flex items-center space-x-3"\>  
                        \<div className="relative"\>  
                          \<Search className="absolute left-3 top-1/2 transform \-translate-y-1/2 w-4 h-4 text-gray-400" /\>  
                          \<Input   
                            placeholder="Rechercher..."   
                            className="pl-10 w-64"   
                            variant="copper"  
                          /\>  
                        \</div\>  
                        \<Button variant="outline" size="sm"\>  
                          \<Filter className="w-4 h-4 mr-2" /\>  
                          Filtres  
                        \</Button\>  
                      \</div\>  
                      \<div className="flex items-center space-x-2"\>  
                        \<Button size="sm" variant="outline"\>  
                          \<Download className="w-4 h-4 mr-2" /\>  
                          Export CSV  
                        \</Button\>  
                        \<Button size="sm" className="bg-\[\#D4841A\] hover:bg-\[\#B8741A\]"\>  
                          \<Plus className="w-4 h-4 mr-2" /\>  
                          Ajouter  
                        \</Button\>  
                      \</div\>  
                    \</div\>

                    {/\* Table avec sélection \*/}  
                    \<div className="border rounded-lg overflow-hidden"\>  
                      \<Table\>  
                        \<TableHeader className="bg-gray-50"\>  
                          \<TableRow\>  
                            \<TableHead className="w-12"\>  
                              \<Checkbox /\>  
                            \</TableHead\>  
                            \<TableHead className="cursor-pointer hover:bg-gray-100 transition-colors"\>  
                              \<div className="flex items-center space-x-1"\>  
                                \<span\>Nom\</span\>  
                                \<ChevronDown className="w-3 h-3 text-gray-400" /\>  
                              \</div\>  
                            \</TableHead\>  
                            \<TableHead className="cursor-pointer hover:bg-gray-100 transition-colors"\>  
                              \<div className="flex items-center space-x-1"\>  
                                \<span\>Email\</span\>  
                                \<ChevronDown className="w-3 h-3 text-gray-400" /\>  
                              \</div\>  
                            \</TableHead\>  
                            \<TableHead\>Statut\</TableHead\>  
                            \<TableHead\>Type\</TableHead\>  
                            \<TableHead\>Date création\</TableHead\>  
                            \<TableHead className="text-right"\>Actions\</TableHead\>  
                          \</TableRow\>  
                        \</TableHeader\>  
                        \<TableBody\>  
                          \<TableRow className="hover:bg-gray-50 transition-colors"\>  
                            \<TableCell\>  
                              \<Checkbox /\>  
                            \</TableCell\>  
                            \<TableCell className="font-medium"\>  
                              \<div className="flex items-center space-x-3"\>  
                                \<div className="w-8 h-8 bg-\[\#D4841A\]/10 rounded-full flex items-center justify-center"\>  
                                  \<User className="w-4 h-4 text-\[\#D4841A\]" /\>  
                                \</div\>  
                                \<span\>Jean Dupont\</span\>  
                              \</div\>  
                            \</TableCell\>  
                            \<TableCell className="text-gray-600"\>jean@exemple.com\</TableCell\>  
                            \<TableCell\>  
                              \<Badge className="bg-green-100 text-green-800 border-green-200"\>  
                                \<CheckCircle2 className="w-3 h-3 mr-1" /\>  
                                Actif  
                              \</Badge\>  
                            \</TableCell\>  
                            \<TableCell\>  
                              \<Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50"\>  
                                Particulier  
                              \</Badge\>  
                            \</TableCell\>  
                            \<TableCell className="text-gray-500"\>15 juil. 2025\</TableCell\>  
                            \<TableCell\>  
                              \<div className="flex items-center justify-end space-x-1"\>  
                                \<Button size="sm" variant="ghost" className="hover:bg-blue-100"\>  
                                  \<Eye className="w-4 h-4 text-blue-600" /\>  
                                \</Button\>  
                                \<Button size="sm" variant="ghost" className="hover:bg-\[\#D4841A\]/10"\>  
                                  \<Edit className="w-4 h-4 text-\[\#D4841A\]" /\>  
                                \</Button\>  
                                \<Button size="sm" variant="ghost" className="hover:bg-red-100"\>  
                                  \<Trash2 className="w-4 h-4 text-red-600" /\>  
                                \</Button\>  
                                \<Button size="sm" variant="ghost"\>  
                                  \<MoreHorizontal className="w-4 h-4 text-gray-400" /\>  
                                \</Button\>  
                              \</div\>  
                            \</TableCell\>  
                          \</TableRow\>  
                          \<TableRow className="hover:bg-gray-50 transition-colors"\>  
                            \<TableCell\>  
                              \<Checkbox /\>  
                            \</TableCell\>  
                            \<TableCell className="font-medium"\>  
                              \<div className="flex items-center space-x-3"\>  
                                \<div className="w-8 h-8 bg-\[\#2D5A27\]/10 rounded-full flex items-center justify-center"\>  
                                  \<Building2 className="w-4 h-4 text-\[\#2D5A27\]" /\>  
                                \</div\>  
                                \<span\>SCI Immobilier Plus\</span\>  
                              \</div\>  
                            \</TableCell\>  
                            \<TableCell className="text-gray-600"\>contact@sci-immo.fr\</TableCell\>  
                            \<TableCell\>  
                              \<Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"\>  
                                \<Clock className="w-3 h-3 mr-1" /\>  
                                En attente  
                              \</Badge\>  
                            \</TableCell\>  
                            \<TableCell\>  
                              \<Badge variant="outline" className="text-purple-700 border-purple-200 bg-purple-50"\>  
                                Société  
                              \</Badge\>  
                            \</TableCell\>  
                            \<TableCell className="text-gray-500"\>12 juil. 2025\</TableCell\>  
                            \<TableCell\>  
                              \<div className="flex items-center justify-end space-x-1"\>  
                                \<Button size="sm" variant="ghost" className="hover:bg-blue-100"\>  
                                  \<Eye className="w-4 h-4 text-blue-600" /\>  
                                \</Button\>  
                                \<Button size="sm" variant="ghost" className="hover:bg-\[\#D4841A\]/10"\>  
                                  \<Edit className="w-4 h-4 text-\[\#D4841A\]" /\>  
                                \</Button\>  
                                \<Button size="sm" variant="ghost" className="hover:bg-red-100"\>  
                                  \<Trash2 className="w-4 h-4 text-red-600" /\>  
                                \</Button\>  
                                \<Button size="sm" variant="ghost"\>  
                                  \<MoreHorizontal className="w-4 h-4 text-gray-400" /\>  
                                \</Button\>  
                              \</div\>  
                            \</TableCell\>  
                          \</TableRow\>  
                          \<TableRow className="hover:bg-gray-50 transition-colors"\>  
                            \<TableCell\>  
                              \<Checkbox /\>  
                            \</TableCell\>  
                            \<TableCell className="font-medium"\>  
                              \<div className="flex items-center space-x-3"\>  
                                \<div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center"\>  
                                  \<User className="w-4 h-4 text-red-600" /\>  
                                \</div\>  
                                \<span\>Marie Martin\</span\>  
                              \</div\>  
                            \</TableCell\>  
                            \<TableCell className="text-gray-600"\>marie@exemple.com\</TableCell\>  
                            \<TableCell\>  
                              \<Badge className="bg-red-100 text-red-800 border-red-200"\>  
                                \<X className="w-3 h-3 mr-1" /\>  
                                Inactif  
                              \</Badge\>  
                            \</TableCell\>  
                            \<TableCell\>  
                              \<Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50"\>  
                                Particulier  
                              \</Badge\>  
                            \</TableCell\>  
                            \<TableCell className="text-gray-500"\>08 juil. 2025\</TableCell\>  
                            \<TableCell\>  
                              \<div className="flex items-center justify-end space-x-1"\>  
                                \<Button size="sm" variant="ghost" className="hover:bg-blue-100"\>  
                                  \<Eye className="w-4 h-4 text-blue-600" /\>  
                                \</Button\>  
                                \<Button size="sm" variant="ghost" className="hover:bg-\[\#D4841A\]/10"\>  
                                  \<Edit className="w-4 h-4 text-\[\#D4841A\]" /\>  
                                \</Button\>  
                                \<Button size="sm" variant="ghost" className="hover:bg-red-100"\>  
                                  \<Trash2 className="w-4 h-4 text-red-600" /\>  
                                \</Button\>  
                                \<Button size="sm" variant="ghost"\>  
                                  \<MoreHorizontal className="w-4 h-4 text-gray-400" /\>  
                                \</Button\>  
                              \</div\>  
                            \</TableCell\>  
                          \</TableRow\>  
                        \</TableBody\>  
                      \</Table\>  
                    \</div\>

                    {/\* Barre actions lot sélectionnées \*/}  
                    \<div className="flex items-center justify-between p-3 bg-\[\#D4841A\]/5 border border-\[\#D4841A\]/20 rounded-lg"\>  
                      \<div className="flex items-center space-x-3"\>  
                        \<span className="text-sm font-medium text-\[\#D4841A\]"\>2 éléments sélectionnés\</span\>  
                        \<div className="h-4 w-px bg-\[\#D4841A\]/30"\>\</div\>  
                        \<Button size="sm" variant="ghost" className="text-\[\#D4841A\] hover:bg-\[\#D4841A\]/10"\>  
                          \<CheckCircle2 className="w-4 h-4 mr-1" /\>  
                          Activer  
                        \</Button\>  
                        \<Button size="sm" variant="ghost" className="text-\[\#D4841A\] hover:bg-\[\#D4841A\]/10"\>  
                          \<Mail className="w-4 h-4 mr-1" /\>  
                          Envoyer email  
                        \</Button\>  
                        \<Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50"\>  
                          \<Trash2 className="w-4 h-4 mr-1" /\>  
                          Supprimer  
                        \</Button\>  
                      \</div\>  
                      \<Button size="sm" variant="ghost" className="text-gray-500"\>  
                        \<X className="w-4 h-4" /\>  
                      \</Button\>  
                    \</div\>  
                  \</CardContent\>  
                \</Card\>

                {/\* Fonctionnalités Tables \*/}  
                \<Card\>  
                  \<CardHeader\>  
                    \<CardTitle\>Fonctionnalités Tables Avancées\</CardTitle\>  
                  \</CardHeader\>  
                  \<CardContent\>  
                    \<div className="grid grid-cols-1 md:grid-cols-3 gap-6"\>  
                      \<div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200"\>  
                        \<h5 className="font-medium text-blue-800 mb-3"\>🔍 Recherche & Filtres\</h5\>  
                        \<ul className="text-sm text-blue-700 space-y-1"\>  
                          \<li\>• Recherche en temps réel\</li\>  
                          \<li\>• Filtres multiples avancés\</li\>  
                          \<li\>• Tri par colonnes\</li\>  
                          \<li\>• Sauvegarde des vues\</li\>  
                        \</ul\>  
                      \</div\>  
                        
                      \<div className="p-4 bg-gradient-to-r from-\[\#D4841A\]/10 to-\[\#D4841A\]/20 rounded-lg border border-\[\#D4841A\]/20"\>  
                        \<h5 className="font-medium text-\[\#D4841A\] mb-3"\>✅ Sélection Multiple\</h5\>  
                        \<ul className="text-sm text-gray-700 space-y-1"\>  
                          \<li\>• Checkbox par ligne\</li\>  
                          \<li\>• Sélection \&quot;Tout\&quot; / \&quot;Aucun\&quot;\</li\>  
                          \<li\>• Actions en lot\</li\>  
                          \<li\>• Barre d\&apos;outils contextuelle\</li\>  
                        \</ul\>  
                      \</div\>  
                        
                      \<div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200"\>  
                        \<h5 className="font-medium text-green-800 mb-3"\>⚡ Performance\</h5\>  
                        \<ul className="text-sm text-green-700 space-y-1"\>  
                          \<li\>• Pagination server-side\</li\>  
                          \<li\>• Virtualisation pour gros datasets\</li\>  
                          \<li\>• Cache intelligent\</li\>  
                          \<li\>• Export CSV optimisé\</li\>  
                        \</ul\>  
                      \</div\>  
                    \</div\>  
                  \</CardContent\>  
                \</Card\>  
              \</div\>  
            \</TabsContent\>

            \<TabsContent value="alerts" className="space-y-6"\>  
              \<div className="space-y-4"\>  
                \<Alert\>  
                  \<Info className="h-4 w-4" /\>  
                  \<AlertTitle\>Information\</AlertTitle\>  
                  \<AlertDescription\>  
                    Ceci est une alerte d\&apos;information standard.  
                  \</AlertDescription\>  
                \</Alert\>

                \<Alert className="border-green-200 bg-green-50"\>  
                  \<CheckCircle2 className="h-4 w-4 text-green-600" /\>  
                  \<AlertTitle className="text-green-800"\>Succès\</AlertTitle\>  
                  \<AlertDescription className="text-green-700"\>  
                    L\&apos;opération s\&apos;est déroulée avec succès.  
                  \</AlertDescription\>  
                \</Alert\>

                \<Alert className="border-yellow-200 bg-yellow-50"\>  
                  \<AlertTriangle className="h-4 w-4 text-yellow-600" /\>  
                  \<AlertTitle className="text-yellow-800"\>Attention\</AlertTitle\>  
                  \<AlertDescription className="text-yellow-700"\>  
                    Cette action nécessite votre attention.  
                  \</AlertDescription\>  
                \</Alert\>

                \<Alert className="border-red-200 bg-red-50"\>  
                  \<AlertCircle className="h-4 w-4 text-red-600" /\>  
                  \<AlertTitle className="text-red-800"\>Erreur\</AlertTitle\>  
                  \<AlertDescription className="text-red-700"\>  
                    Une erreur s\&apos;est produite lors du traitement.  
                  \</AlertDescription\>  
                \</Alert\>  
              \</div\>  
            \</TabsContent\>

            \<TabsContent value="navigation" className="space-y-6"\>  
              \<div className="grid grid-cols-1 lg:grid-cols-2 gap-8"\>  
                {/\* Sidebar Réelle \*/}  
                \<Card\>  
                  \<CardHeader\>  
                    \<CardTitle className="flex items-center space-x-2"\>  
                      \<Layout className="w-5 h-5" /\>  
                      \<span\>Dashboard Sidebar Réelle\</span\>  
                    \</CardTitle\>  
                    \<CardDescription\>  
                      La vraie sidebar utilisée dans l\&apos;application avec logo animé, badges et profil utilisateur  
                    \</CardDescription\>  
                  \</CardHeader\>  
                  \<CardContent\>  
                    \<div className="border rounded-lg p-4 bg-gradient-to-br from-slate-50 to-slate-100"\>  
                      \<div className="max-w-\[280px\] mx-auto"\>  
                        \<DashboardSidebar   
                          ownersCount={12}  
                          organizationsCount={3}  
                          userProfile={{  
                            full\_name: "Demo User",  
                            email: "demo@wantitnow.com",  
                            role: "admin"  
                          }}  
                        /\>  
                      \</div\>  
                    \</div\>  
                  \</CardContent\>  
                \</Card\>

                {/\* États Navigation \*/}  
                \<Card\>  
                  \<CardHeader\>  
                    \<CardTitle\>États de Navigation\</CardTitle\>  
                    \<CardDescription\>  
                      Démonstration des différents états interactifs avec couleurs Want It Now  
                    \</CardDescription\>  
                  \</CardHeader\>  
                  \<CardContent className="space-y-6"\>  
                    \<div\>  
                      \<h4 className="font-semibold mb-3 text-\[\#D4841A\]"\>États Sidebar Items\</h4\>  
                      \<div className="space-y-2"\>  
                        {/\* État Normal \*/}  
                        \<div className="flex items-center p-3 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-all"\>  
                          \<Home className="h-4 w-4 mr-3 text-gray-500" /\>  
                          \<span className="text-gray-700"\>État Normal\</span\>  
                        \</div\>  
                          
                        {/\* État Hover \*/}  
                        \<div className="flex items-center p-3 rounded-lg bg-gray-50 border border-gray-300 transition-all"\>  
                          \<Building className="h-4 w-4 mr-3 text-gray-600" /\>  
                          \<span className="text-gray-800"\>État Hover\</span\>  
                        \</div\>  
                          
                        {/\* État Actif \*/}  
                        \<div className="flex items-center p-3 rounded-lg bg-\[\#D4841A\]/10 border-r-2 border-\[\#D4841A\] transition-all"\>  
                          \<Users className="h-4 w-4 mr-3 text-\[\#D4841A\]" /\>  
                          \<span className="text-\[\#D4841A\] font-medium"\>État Actif\</span\>  
                          \<Badge className="ml-auto bg-\[\#D4841A\] text-white"\>12\</Badge\>  
                        \</div\>  
                          
                        {/\* État avec Badge \*/}  
                        \<div className="flex items-center p-3 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-all"\>  
                          \<Calendar className="h-4 w-4 mr-3 text-gray-500" /\>  
                          \<span className="text-gray-700"\>Avec Badge\</span\>  
                          \<Badge className="ml-auto bg-gray-100 text-gray-800"\>24\</Badge\>  
                        \</div\>  
                      \</div\>  
                    \</div\>

                    \<div\>  
                      \<h4 className="font-semibold mb-3 text-\[\#2D5A27\]"\>Logo Animé Want It Now\</h4\>  
                      \<div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200"\>  
                        \<div className="relative w-10 h-10"\>  
                          \<div className="absolute inset-0 bg-\[\#D4841A\] rounded-lg transform rotate-45 origin-center opacity-80 animate-pulse"\>\</div\>  
                          \<div className="absolute inset-0 bg-\[\#2D5A27\] rounded-lg transform \-rotate-45 origin-center animate-pulse"\>\</div\>  
                        \</div\>  
                        \<div className="flex flex-col"\>  
                          \<span className="font-semibold text-gray-900"\>Want It Now\</span\>  
                          \<span className="text-xs text-gray-500"\>Dashboard\</span\>  
                        \</div\>  
                      \</div\>  
                    \</div\>  
                  \</CardContent\>  
                \</Card\>  
              \</div\>  
            \</TabsContent\>

            \<TabsContent value="feedback" className="space-y-6"\>  
              \<Card\>  
                \<CardHeader\>  
                  \<CardTitle\>Éléments de Feedback\</CardTitle\>  
                \</CardHeader\>  
                \<CardContent className="space-y-6"\>  
                  \<div\>  
                    \<h4 className="font-semibold mb-3"\>Skeletons\</h4\>  
                    \<div className="space-y-2"\>  
                      \<Skeleton className="h-4 w-full" /\>  
                      \<Skeleton className="h-4 w-3/4" /\>  
                      \<Skeleton className="h-4 w-1/2" /\>  
                    \</div\>  
                  \</div\>

                  \<div\>  
                    \<h4 className="font-semibold mb-3"\>Progress\</h4\>  
                    \<Progress value={75} className="w-full" /\>  
                  \</div\>

                  \<div\>  
                    \<h4 className="font-semibold mb-4"\>Badges \- Système Complet Want It Now\</h4\>  
                      
                    \<div className="space-y-6"\>  
                      {/\* Badges de base \*/}  
                      \<div\>  
                        \<h5 className="text-sm font-medium text-gray-700 mb-3"\>Badges Standards\</h5\>  
                        \<div className="flex flex-wrap gap-2"\>  
                          \<Badge\>Default\</Badge\>  
                          \<Badge variant="secondary"\>Secondary\</Badge\>  
                          \<Badge variant="outline"\>Outline\</Badge\>  
                          \<Badge variant="destructive"\>Destructive\</Badge\>  
                        \</div\>  
                      \</div\>

                      {/\* Nouveaux badges Want It Now \*/}  
                      \<div\>  
                        \<h5 className="text-sm font-medium text-gray-700 mb-3"\>Badges Want It Now\</h5\>  
                        \<div className="flex flex-wrap gap-2"\>  
                          \<Badge variant="success"\>Success\</Badge\>  
                          \<Badge variant="warning"\>Warning\</Badge\>  
                          \<Badge variant="error"\>Error\</Badge\>  
                          \<Badge variant="info"\>Info\</Badge\>  
                          \<Badge variant="copper"\>Copper\</Badge\>  
                          \<Badge variant="brand"\>Brand\</Badge\>  
                        \</div\>  
                      \</div\>

                      {/\* Badges avec icônes \*/}  
                      \<div\>  
                        \<h5 className="text-sm font-medium text-gray-700 mb-3"\>Badges avec Icônes\</h5\>  
                        \<div className="flex flex-wrap gap-2"\>  
                          \<BadgeWithIcon icon={User} variant="success"\>Propriétaire\</BadgeWithIcon\>  
                          \<BadgeWithIcon icon={Building} variant="info"\>Propriété\</BadgeWithIcon\>  
                          \<BadgeWithIcon icon={Calendar} variant="warning"\>Réservation\</BadgeWithIcon\>  
                          \<BadgeWithIcon icon={TrendingUp} variant="brand"\>KPI\</BadgeWithIcon\>  
                          \<BadgeWithIcon icon={CheckCircle2} variant="success" iconPosition="right"\>Confirmé\</BadgeWithIcon\>  
                        \</div\>  
                      \</div\>

                      {/\* Badges Avatar \*/}  
                      \<div\>  
                        \<h5 className="text-sm font-medium text-gray-700 mb-3"\>Badges Avatar\</h5\>  
                        \<div className="flex flex-wrap gap-2"\>  
                          \<AvatarBadge variant="success" fallback="JD"\>John Doe\</AvatarBadge\>  
                          \<AvatarBadge variant="info" fallback="MS"\>Marie Smith\</AvatarBadge\>  
                          \<AvatarBadge variant="copper" fallback="PA"\>Pierre Admin\</AvatarBadge\>  
                          \<AvatarBadge variant="brand" fallback="MG"\>Manager\</AvatarBadge\>  
                        \</div\>  
                      \</div\>  
                    \</div\>  
                  \</div\>  
                \</CardContent\>  
              \</Card\>  
            \</TabsContent\>

            \<TabsContent value="modals" className="space-y-6"\>  
              \<div className="grid grid-cols-1 gap-8"\>  
                {/\* Section Modals Wizards \*/}  
                \<Card\>  
                  \<CardHeader\>  
                    \<CardTitle className="flex items-center space-x-2"\>  
                      \<Plus className="w-5 h-5" /\>  
                      \<span\>Modals Wizards Want It Now\</span\>  
                    \</CardTitle\>  
                    \<CardDescription\>  
                      Modals de création avec processus wizard multi-étapes intégrés dans l\&apos;application  
                    \</CardDescription\>  
                  \</CardHeader\>  
                  \<CardContent className="space-y-8"\>  
                    {/\* Modal Organisations \*/}  
                    \<div className="space-y-4"\>  
                      \<div className="flex items-center space-x-3"\>  
                        \<div className="w-10 h-10 bg-gradient-to-r from-\[\#D4841A\] to-\[\#B8741A\] rounded-lg flex items-center justify-center"\>  
                          \<Building className="w-5 h-5 text-white" /\>  
                        \</div\>  
                        \<div\>  
                          \<h4 className="font-semibold text-gray-900"\>Création Organisation\</h4\>  
                          \<p className="text-sm text-gray-600"\>Modal simple avec validation en temps réel\</p\>  
                        \</div\>  
                      \</div\>  
                        
                      \<div className="border rounded-lg p-4 bg-gradient-to-br from-orange-50 to-orange-100"\>  
                        \<CreateOrganizationModal\>  
                          \<Button variant="outline" className="w-full border-\[\#D4841A\]/20 text-\[\#D4841A\] hover:bg-\[\#D4841A\]/10"\>  
                            \<Building className="w-4 h-4 mr-2" /\>  
                            Démonstration Modal Organisation  
                          \</Button\>  
                        \</CreateOrganizationModal\>  
                      \</div\>  
                    \</div\>

                    