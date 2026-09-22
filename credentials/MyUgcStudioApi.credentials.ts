import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class MyUgcStudioApi implements ICredentialType {
	name = 'myUgcStudioApi';

	displayName = 'My UGC Studio API';

	icon = 'file:../nodes/MyUgcStudio/myUgcStudio.svg' as const;

	documentationUrl = 'https://web.myugc.studio/user-profile?open=integrations';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Create an API key in My UGC Studio under Profile > Integrations > Zapier',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://web.myugc.studio',
			url: '/api/zapier/me',
			method: 'GET',
		},
	};
}
