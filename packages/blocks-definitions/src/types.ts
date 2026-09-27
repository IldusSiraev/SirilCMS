// Контракты — единые типы пакета @siril/blocks-definitions (список: план, раздел «Контракты» T2)

export type BlockFieldType = 'text'|'email'|'richtext'|'number'|'boolean'|'select'|'image'|'link'|'array-text'|'image-array'|'object-array'|'page'|'form'
export type LocalizedLabel = Record<string, string>
export interface BlockField  { name: string; type: BlockFieldType; label: LocalizedLabel; required?: boolean; placeholder?: string; options?: {value:string;label:string}[]; maxItems?: number; subfields?: BlockField[] }
export type VariantLayout = 'center' | 'split-left' | 'split-right' | 'banner' | 'grid' | 'list'
export interface BlockVariantDef { id: string; name: string; fields: BlockField[]; layout?: VariantLayout }   // variants[0] = дефолт; layout — для превью-картинки в админке (см. variant-preview.ts), по умолчанию 'center'
export interface BlockDef { type: string; name: string; description?: string; variants: BlockVariantDef[] }

export interface ThemeBlockConfig { enabled: boolean; variants?: string[]; defaultVariant?: string }
export interface ThemeDef { id: string; name: string; preview?: string; tokens: Record<string,string>; blocks: Record<string, ThemeBlockConfig> }

export type FormFieldType = 'text'|'email'|'tel'|'textarea'|'select'|'checkbox'|'checkbox-group'|'date'|'file'|'consent'|'honeypot'
export interface FormFieldDef { id: string; name: string; type: FormFieldType; label: string; required: boolean; placeholder?: string; options?: string[] }

export interface PayloadField { [key: string]: unknown }
