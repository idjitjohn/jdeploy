import { Schema, model, Document } from 'mongoose'

interface NginxTemplate extends Document {
    enabled: boolean
    template: string[]
}

const nginxTemplateSchema = new Schema<NginxTemplate>({
    enabled: {
        type: Boolean,
        default: true,
    },
    template: [String],
}, { _id: false })

interface Template extends Document {
    name: string
    displayName: string
    description: string
    commands: string[]
    preDeploy: string[]
    postDeploy: string[]
    nginx: NginxTemplate
    env: Map<string, string>
    isSystem: boolean
    createdAt: Date
    updatedAt: Date
}

const templateSchema = new Schema<Template>({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    displayName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    commands: [String],
    preDeploy: {
        type: [String],
        default: [],
    },
    postDeploy: {
        type: [String],
        default: [],
    },
    nginx: {
        type: nginxTemplateSchema,
        default: () => ({ enabled: true, template: [] }),
    },
    env: {
        type: Map,
        of: String,
        default: () => new Map(),
    },
    isSystem: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
})

templateSchema.index({ name: 1 })

const TemplateModel = model<Template>('Template', templateSchema)

export default TemplateModel
