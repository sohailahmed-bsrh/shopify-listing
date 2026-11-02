const fs = require('fs');
const path = require('path');

const viewPath = path.resolve(__dirname, '../ems_project/frontend/src/components/ShopifyProductsView.tsx');
let content = fs.readFileSync(viewPath, 'utf8');

// 1. Add connectClientId and connectClientSecret state
if (!content.includes('connectClientId')) {
  content = content.replace(
    'const [connectToken, setConnectToken] = useState(\'\');',
    `const [connectToken, setConnectToken] = useState('');\n  const [connectClientId, setConnectClientId] = useState('');\n  const [connectClientSecret, setConnectClientSecret] = useState('');`
  );
}

// 2. Update handleConnectSubmit to pass client_id and client_secret
content = content.replace(
  'const res = await api.connectShopifyStore({ shop: connectShopDomain.trim() });',
  `const res = await api.connectShopifyStore({\n          shop: connectShopDomain.trim(),\n          client_id: connectClientId.trim() || undefined,\n          client_secret: connectClientSecret.trim() || undefined\n        });`
);

// 3. Add Client ID & Secret fields in the OAuth form
const oauthHelpTarget = `<p className="text-[11px] text-zinc-500 mt-1">
                  {connectTab === 'oauth'
                    ? 'You will be redirected to Shopify to review and approve permissions.'
                    : 'Enter your store domain as created on Shopify.'}
                </p>
              </div>`;

const oauthFields = `<p className="text-[11px] text-zinc-500 mt-1">
                  {connectTab === 'oauth'
                    ? 'Enter your store domain (e.g. mystore.myshopify.com) to authorize.'
                    : 'Enter your store domain as created on Shopify.'}
                </p>
              </div>

              {connectTab === 'oauth' && (
                <div className="space-y-3 pt-1 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Partner App Credentials (devsil-ems)
                    </span>
                    <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full font-mono">
                      Optional
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Client ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. c7bf11a255d6b7f3105b6fdc9f48f7"
                      value={connectClientId}
                      onChange={e => setConnectClientId(e.target.value)}
                      className="w-full bg-[#181824] text-xs text-white placeholder-zinc-500 rounded-xl px-3.5 py-2 border border-white/10 focus:border-purple-500/60 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Client Secret
                    </label>
                    <input
                      type="password"
                      placeholder="e.g. shpss_..."
                      value={connectClientSecret}
                      onChange={e => setConnectClientSecret(e.target.value)}
                      className="w-full bg-[#181824] text-xs text-white placeholder-zinc-500 rounded-xl px-3.5 py-2 border border-white/10 focus:border-purple-500/60 outline-none font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Paste the Client ID & Secret from your new app on <strong>dev.shopify.com</strong> so Shopify authorizes with that specific app.
                  </p>
                </div>
              )}`;

if (content.includes(oauthHelpTarget)) {
  content = content.replace(oauthHelpTarget, oauthFields);
  console.log('Replaced with LF');
} else {
  const oauthHelpTargetCRLF = oauthHelpTarget.replace(/\n/g, '\r\n');
  const oauthFieldsCRLF = oauthFields.replace(/\n/g, '\r\n');
  if (content.includes(oauthHelpTargetCRLF)) {
    content = content.replace(oauthHelpTargetCRLF, oauthFieldsCRLF);
    console.log('Replaced with CRLF');
  } else {
    console.error('Could not find oauthHelpTarget in ShopifyProductsView.tsx');
  }
}

fs.writeFileSync(viewPath, content, 'utf8');
console.log('Successfully patched ShopifyProductsView.tsx with OAuth credentials fields');
