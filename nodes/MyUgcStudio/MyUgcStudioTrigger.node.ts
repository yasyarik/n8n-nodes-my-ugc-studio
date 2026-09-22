import type {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes } from 'n8n-workflow';

const ASSETS_ENDPOINT = 'https://web.myugc.studio/api/zapier/triggers/new-assets';

type Asset = IDataObject & {
	id: string;
	created_at?: string;
};

function normaliseAssets(response: unknown): Asset[] {
	if (Array.isArray(response)) return response as Asset[];
	if (response && typeof response === 'object') {
		const body = response as { assets?: unknown; results?: unknown; data?: unknown };
		for (const candidate of [body.assets, body.results, body.data]) {
			if (Array.isArray(candidate)) return candidate as Asset[];
		}
	}
	return [];
}

export class MyUgcStudioTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'My UGC Studio Trigger',
		name: 'myUgcStudioTrigger',
		icon: { light: 'file:myUgcStudio.svg', dark: 'file:myUgcStudio.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Starts the workflow when My UGC Studio generates a new asset',
		defaults: { name: 'My UGC Studio Trigger' },
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		polling: true,
		credentials: [{ name: 'myUgcStudioApi', required: true }],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: [
					{
						name: 'New Asset Generated',
						value: 'newAssetGenerated',
						description: 'Runs when a new image or video asset is generated',
					},
				],
				default: 'newAssetGenerated',
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		try {
			const response = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'myUgcStudioApi',
				{
					method: 'GET',
					url: ASSETS_ENDPOINT,
					headers: { Accept: 'application/json' },
					json: true,
				},
			);
			const assets = normaliseAssets(response).sort((a, b) =>
				String(a.created_at ?? '').localeCompare(String(b.created_at ?? '')),
			);

			if (assets.length === 0) return null;

			if (this.getMode() === 'manual') {
				return [assets.slice(-10).map((asset) => ({ json: asset }))];
			}

			const state = this.getWorkflowStaticData('node');
			const lastCreatedAt = typeof state.lastCreatedAt === 'string' ? state.lastCreatedAt : '';
			const lastIds = Array.isArray(state.lastIds) ? (state.lastIds as string[]) : [];
			const newestCreatedAt = String(assets.at(-1)?.created_at ?? '');

			if (!lastCreatedAt) {
				state.lastCreatedAt = newestCreatedAt;
				state.lastIds = assets
					.filter((asset) => String(asset.created_at ?? '') === newestCreatedAt)
					.map((asset) => String(asset.id));
				return null;
			}

			const freshAssets = assets.filter((asset) => {
				const createdAt = String(asset.created_at ?? '');
				return createdAt > lastCreatedAt || (createdAt === lastCreatedAt && !lastIds.includes(String(asset.id)));
			});

			state.lastCreatedAt = newestCreatedAt;
			state.lastIds = assets
				.filter((asset) => String(asset.created_at ?? '') === newestCreatedAt)
				.map((asset) => String(asset.id));

			if (freshAssets.length === 0) return null;
			return [freshAssets.map((asset) => ({ json: asset }))];
		} catch (error) {
			const apiError: JsonObject =
				error instanceof Error
					? { name: error.name, message: error.message }
					: (error as JsonObject);
			throw new NodeApiError(this.getNode(), apiError);
		}
	}
}
