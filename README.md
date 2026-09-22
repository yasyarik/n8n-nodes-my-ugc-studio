# n8n-nodes-my-ugc-studio

This n8n community node connects [My UGC Studio](https://myugc.studio) to n8n workflows. Generate AI product images from public source image URLs and start workflows when new assets are generated.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

* **Generate Product Image** — creates an AI product visual using an automatic, flat-lay, or lifestyle profile.
* **New Asset Generated** — polling trigger for newly generated image and video assets.

## Credentials

Create an API key in My UGC Studio under **Profile > Integrations > Zapier**, then paste it into the **My UGC Studio API** credential in n8n. The key is stored as a password field and sent as a Bearer token.

## Compatibility

Built with the current n8n community node tool and Nodes API version 1.

## Usage

The source image must be available over public HTTPS and be no larger than 15 MB. The trigger records a cursor on its first scheduled poll so existing assets are not emitted as new; manual tests return up to ten recent assets.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [My UGC Studio](https://myugc.studio)
* [API key settings](https://web.myugc.studio/user-profile?open=integrations)

## Version history

* **0.1.0** — initial Generate Product Image action and New Asset Generated trigger.
