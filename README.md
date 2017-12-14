# @conga/framework-profiler-client

-- Work in progress --

```yaml
# default security config
# these settings can be modified in app/config/config.yml
security:
    encryption:
        ClientProfiler_RecordingAccount:
            path: "@conga/framework-profiler-client:model/RecordingAccount"
            algorithm: bcrypt
            saltRounds: 15
            encode_as_base64: true
 
    authenticators:
        ClientProfiler: "@security.firewall.authenticator.http_basic"
        ClientProfiler_EventApi: "@profiler.client.security.authenticator.event_api"
 
    providers:
        # NOTE: the provider needs to resolve a RecordingAccount instance
        ClientProfiler:
            bass:
                document: "@conga/framework-profiler-client:model/RecordingAccount"
                login: publicKey
                secret: secretKey
 
        ClientProfiler_EventApi: "@profiler.client.security.provider.event_api"
```