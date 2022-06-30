import { h, render, VNode } from 'preact'
import {
  useState,
  StateUpdater,
  useMemo,
  useRef,
  useLayoutEffect
} from 'preact/hooks'
import { LylaRequestOptions, LylaAdapterMeta } from '@lylajs/core'

function JsonView({
  json,
  unwrapJsonString,
  inArray = false,
  level = 0
}: {
  json: Record<string, any> | string | number | undefined | null | boolean
  unwrapJsonString: boolean
  inArray?: boolean
  level?: number
}): VNode | null {
  if (json === undefined) return null
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  let indent = ''
  for (let i = 0; i < level; ++i) {
    indent += '  '
  }
  if (json && typeof json === 'object') {
    if (Array.isArray(json)) {
      return h(level === 0 ? 'pre' : 'span', { style: { margin: 0 } }, [
        (inArray ? indent : '') + '[\n',
        json.map((v, index) => {
          return [
            h(JsonView, {
              json: v,
              unwrapJsonString,
              inArray: true,
              level: level + 1
            }),
            json.length === index + 1 ? '\n' : ',\n'
          ]
        }),
        indent + ']'
      ])
    } else {
      const keys = Object.keys(json)
      return h(level === 0 ? 'pre' : 'span', { style: { margin: 0 } }, [
        (inArray ? indent : '') + '{\n',
        keys.map((key, index) => {
          const isLast = index === keys.length - 1
          let value: any = json[key]
          let type = typeof value
          const valueIsJsonObjectString =
            type === 'string' && /^(\[|\{)/.test(value)
          const valueIsObject = value && type === 'object'

          if (valueIsJsonObjectString) {
            value = JSON.parse(value)
          }

          if (
            expandedKeys.includes(key) ||
            !(valueIsObject || valueIsJsonObjectString)
          ) {
            return [
              indent,
              '  ',
              h(
                'span',
                {
                  style:
                    valueIsObject || valueIsJsonObjectString
                      ? {
                          cursor: 'pointer'
                        }
                      : undefined,
                  onClick:
                    valueIsObject || valueIsJsonObjectString
                      ? () => {
                          setExpandedKeys(
                            expandedKeys.filter(
                              (expandedKey) => expandedKey !== key
                            )
                          )
                        }
                      : undefined
                },
                [key]
              ),
              valueIsJsonObjectString ? ' (JSON String)' : null,
              ': ',
              h(JsonView, { json: value, unwrapJsonString, level: level + 1 }),
              isLast ? null : ',',
              '\n'
            ]
          }
          return h(
            'span',
            {
              style: {
                cursor: 'pointer'
              },
              onClick: () => {
                setExpandedKeys(expandedKeys.concat(key))
              }
            },
            [indent, '  ', key, ': ...', isLast ? null : ',', '\n']
          )
        }),
        indent + '}'
      ])
    }
  } else {
    return h('span', null, [
      inArray ? indent : null,
      `${typeof json === 'string' ? `"${json}"` : json}`
    ])
  }
}

export function createLylaUi<M extends LylaAdapterMeta = LylaAdapterMeta>(): {
  lylaOptions: LylaRequestOptions<M>
  mount: (el: HTMLElement) => void
} {
  type Request = {
    id: string
    url: string
    method: string
    headers: Record<string, any> | undefined
    json: Record<string, any> | string | number | undefined | null | boolean
    response?: Response
    __status: 'pending' | 'ok' | 'error' | 'errorWithoutResponse'
  }

  type Response = {
    id: string
    status: string
    headers: Record<string, any> | undefined
    body: string | undefined
  }

  let _setRequests: StateUpdater<Request[]>

  const options: LylaRequestOptions<M> = {
    hooks: {
      onBeforeRequest: [
        (requestOptions, id) => {
          _setRequests((requests) => {
            return requests.concat([
              {
                id,
                url: requestOptions.url || '',
                method: requestOptions.method || '',
                headers: requestOptions.headers,
                json: requestOptions.json,
                response: undefined,
                __status: 'pending'
              }
            ])
          })
          return requestOptions
        }
      ],
      onAfterResponse: [
        (response, id) => {
          _setRequests((requests) => {
            for (const request of requests) {
              if (request.id === id) {
                request.__status = 'ok'
                request.response = {
                  id,
                  status: `${response.status}`,
                  headers: response.headers,
                  body: response.json
                }
                break
              }
            }
            return Array.from(requests)
          })
          return response
        }
      ],
      onResponseError: [
        (e, id) => {
          const { response } = e
          _setRequests((requests) => {
            for (const request of requests) {
              if (request.id === id) {
                if (response) {
                  request.__status = 'error'
                  request.response = {
                    id,
                    status: `${response.status}`,
                    headers: response.headers,
                    body: response.body
                  }
                } else {
                  request.__status = 'errorWithoutResponse'
                  request.response = {
                    id,
                    status: 'error',
                    headers: undefined,
                    body: undefined
                  }
                }
                break
              }
            }
            return Array.from(requests)
          })
          return response
        }
      ]
    }
  }

  function LylaDebugger() {
    const [requests, setRequests] = useState<Request[]>([])
    const [activeRequest, setActiveRequest] = useState<Request | null>(null)
    if (!_setRequests) {
      _setRequests = setRequests
    }
    const requestListRef = useRef<HTMLElement | null>(null)
    const isAtBottomRef = useRef(true)
    useMemo(() => {
      const requestListEl = requestListRef.current
      if (!requestListEl) return
      isAtBottomRef.current =
        requestListEl.scrollTop + requestListEl.offsetHeight >=
        requestListEl.scrollHeight
    }, [requests])
    useLayoutEffect(() => {
      const requestListEl = requestListRef.current
      if (!requestListEl) return
      if (isAtBottomRef.current) {
        requestListEl.scrollTop = requestListEl.scrollHeight
      }
    }, [requests])
    return h(
      'div',
      {
        style: {
          zIndex: '9999',
          fontFamily: 'Courier',
          position: 'fixed',
          right: '16px',
          left: '16px',
          bottom: '16px',
          border: '1px solid #eee',
          borderRadius: '4px',
          boxShadow: '0 4px 8px 2px rgba(0, 0, 0, .08)'
        }
      },
      [
        h(
          'div',
          {
            style: {
              fontSize: '16px',
              lineHeight: '24px',
              padding: '12px 16px',
              boxSizing: 'border-box',
              borderBottom: '1px solid #eee'
            }
          },
          ['Lyla Debugger']
        ),
        h(
          'div',
          {
            ref: requestListRef as any,
            style: {
              padding: '12px 16px',
              fontSize: '14px',
              lineHeight: '20px',
              overflow: 'auto',
              maxHeight: '360px'
            }
          },
          requests.length
            ? requests.map((request) => {
                return h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      cursor: 'pointer'
                    },
                    onClick: () => {
                      setActiveRequest(request)
                    }
                  },
                  [
                    h(
                      'div',
                      {
                        style: {
                          boxSizing: 'border-box',
                          width: '50px'
                        }
                      },
                      [request.id]
                    ),
                    h(
                      'div',
                      {
                        style: {
                          width: '200px'
                        }
                      },
                      [request.url]
                    ),
                    h(
                      'div',
                      {
                        style: {
                          width: '100px'
                        }
                      },
                      [request.method]
                    ),
                    h('div', null, [request.response?.status || '-'])
                  ]
                )
              })
            : ['None']
        ),
        activeRequest
          ? h(
              'div',
              {
                style: {
                  padding: '12px 16px',
                  fontSize: '14px',
                  lineHeight: '20px',
                  overflow: 'auto',
                  maxHeight: '360px',
                  borderTop: '1px solid #eee'
                }
              },
              [
                h(LylaDetailPanel, {
                  key: activeRequest.id,
                  request: activeRequest,
                  status: activeRequest.__status
                })
              ]
            )
          : null
      ]
    )
  }

  function LylaDetailPanel({ request }: { request: Request }) {
    const [mode, setMode] = useState<'request' | 'response'>('request')
    const modeIsRequest = mode === 'request'
    const headers = modeIsRequest ? request.headers : request.response?.headers
    const body = modeIsRequest ? request.json : request.response?.body
    const responseAvailable =
      request.__status !== 'errorWithoutResponse' && request.response
    return h('div', null, [
      h('pre', { style: { margin: 0 } }, [
        request.id,
        ' ',
        request.url,
        ' ',
        request.method
      ]),
      h('pre', { style: { margin: 0 } }, [
        h(
          'span',
          {
            style: {
              cursor: modeIsRequest ? 'default' : 'pointer',
              textDecoration: modeIsRequest ? 'underline' : undefined
            },
            onClick: () => {
              setMode('request')
            }
          },
          ['Request']
        ),
        ' ',
        h(
          'span',
          {
            style: {
              color: responseAvailable ? undefined : '#999',
              cursor: responseAvailable ? 'pointer' : 'not-allowed',
              textDecoration: !modeIsRequest ? 'underline' : undefined
            },
            onClick: responseAvailable
              ? () => {
                  setMode('response')
                }
              : undefined
          },
          [
            'Response',
            request.__status === 'errorWithoutResponse'
              ? ' (Unavailable)'
              : request.response
              ? null
              : ' (Waiting)'
          ]
        )
      ]),
      h('pre', { style: { margin: 0 } }, [
        '\n',
        '[Headers]\n',
        headers
          ? Object.entries(headers).map(([key, value]) => {
              return `${key}: ${value}\n`
            })
          : 'None\n',
        '\n',
        '[Body]'
      ]),
      h(JsonView, {
        json: body,
        unwrapJsonString: true
      })
    ])
  }

  return {
    mount: (el) => {
      render(h(LylaDebugger, null), el)
    },
    lylaOptions: options
  }
}
