import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

const GENERATE_ENDPOINT =
	'https://web.myugc.studio/api/zapier/actions/generate-asset-from-source';

export class MyUgcStudio implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'My UGC Studio',
		name: 'myUgcStudio',
		icon: { light: 'file:myUgcStudio.svg', dark: 'file:myUgcStudio.dark.svg' },
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Generate AI product visuals with My UGC Studio',
		defaults: { name: 'My UGC Studio' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'myUgcStudioApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [{ name: 'Product Image', value: 'productImage' }],
				default: 'productImage',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['productImage'] } },
				options: [
					{
						name: 'Generate',
						value: 'generate',
						description: 'Generate a product image from a public source image URL',
						action: 'Generate a product image',
					},
				],
				default: 'generate',
			},
			{
				displayName: 'Source Image URL',
				name: 'sourceImageUrl',
				type: 'string',
				default: '',
				placeholder: 'https://example.com/product.jpg',
				description: 'Public HTTPS URL of the source product image (maximum 15 MB)',
				required: true,
				displayOptions: { show: { resource: ['productImage'], operation: ['generate'] } },
			},
			{
				displayName: 'Style Profile',
				name: 'style',
				type: 'options',
				options: [
					{ name: 'Automatic Product Image', value: 'default' },
					{ name: 'E-Commerce Flat Lay', value: 'ecommerce_flatlay' },
					{ name: 'Lifestyle With Model', value: 'lifestyle_model' },
				],
				default: 'default',
				required: true,
				displayOptions: { show: { resource: ['productImage'], operation: ['generate'] } },
			},
			{
				displayName: 'Product Title',
				name: 'productTitle',
				type: 'string',
				default: '',
				description: 'Optional name used for the generated asset in My UGC Studio',
				displayOptions: { show: { resource: ['productImage'], operation: ['generate'] } },
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;

				if (resource !== 'productImage' || operation !== 'generate') {
					throw new NodeOperationError(this.getNode(), 'Unsupported operation', { itemIndex });
				}

				const sourceImageUrl = this.getNodeParameter('sourceImageUrl', itemIndex) as string;
				const style = this.getNodeParameter('style', itemIndex) as string;
				const productTitle = this.getNodeParameter('productTitle', itemIndex, '') as string;

				const response = (await this.helpers.httpRequestWithAuthentication.call(
					this,
					'myUgcStudioApi',
					{
						method: 'POST',
						url: GENERATE_ENDPOINT,
						headers: { Accept: 'application/json' },
						body: {
							source_image_url: sourceImageUrl,
							profile_id: style,
							product_title: productTitle || undefined,
						},
						json: true,
					},
				)) as IDataObject;

				returnData.push({ json: response, pairedItem: { item: itemIndex } });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: itemIndex },
					});
					continue;
				}

				if (error instanceof NodeOperationError) {
					throw new NodeOperationError(this.getNode(), error.message, { itemIndex });
				}
				const apiError: JsonObject =
					error instanceof Error
						? { name: error.name, message: error.message }
						: (error as JsonObject);
				throw new NodeApiError(this.getNode(), apiError, { itemIndex });
			}
		}

		return [returnData];
	}
}
