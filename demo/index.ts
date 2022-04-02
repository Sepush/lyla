import axios from 'axios'
import { lyla, catchError } from '../src'

const request = lyla.extend({ baseUrl: '/api/' })

type Handler = [string, () => void]

const handlers: Handler[] = [
  [
    'res-text (responseType text)',
    () => {
      request
        .get('res-text', {
          responseType: 'text'
        })
        .then(({ body }) => {
          console.log(body)
        })
    }
  ],
  [
    'req-text-res-text (responseType json)',
    () => {
      request({
        method: 'GET',
        url: 'res-text'
      }).then(({ body }) => {
        console.log(body)
      })
      axios
        .get('/api/res-text', {
          responseType: 'json'
        })
        .then((resp) => {
          console.log(resp.data)
        })
      fetch('/api/res-text', {
        method: 'GET'
      })
        .then((resp) => {
          return resp.json()
        })
        .then((data) => {
          console.log('fetch', data)
        })
    }
  ],
  [
    'res-text (responseType blob)',
    () => {
      request({
        method: 'GET',
        url: 'res-text',
        responseType: 'blob'
      }).then(({ body }) => {
        console.log(body)
      })
    }
  ],
  [
    'res-text (responseType array buffer)',
    () => {
      request({
        method: 'GET',
        url: 'res-text',
        responseType: 'arraybuffer'
      }).then(({ body }) => {
        console.log(body)
      })
    }
  ],
  [
    'req-json-res-text (responseType json)',
    () => {
      request({
        method: 'GET',
        url: 'res-text',
        json: {
          jsonKey: 'jsonValue'
        }
      }).then(({ body }) => {
        console.log(body)
      })
    }
  ],
  [
    'req-json-res-json (responseType json)',
    () => {
      request({
        method: 'GET',
        url: 'res-json',
        json: {
          jsonKey: 'jsonValue'
        }
      }).then(({ body }) => {
        console.log(body)
      })
      // axios.get("/api/res-json").then((resp) => {
      //   console.log("axios", resp.data);
      // });
      // fetch("/api/res-json", {
      //   method: "GET",
      // })
      //   .then((resp) => {
      //     return resp.json();
      //   })
      //   .then((data) => {
      //     console.log("fetch", data);
      //   });
    }
  ],
  [
    'post-req-json-res-json (responseType json)',
    () => {
      request({
        method: 'POST',
        url: 'res-json',
        json: {
          jsonKey: 'jsonValue'
        }
      }).then(({ body }) => {
        console.log(body)
      })
      // axios.get("/api/res-json").then((resp) => {
      //   console.log("axios", resp.data);
      // });
      // fetch("/api/res-json", {
      //   method: "GET",
      // })
      //   .then((resp) => {
      //     return resp.json();
      //   })
      //   .then((data) => {
      //     console.log("fetch", data);
      //   });
    }
  ],
  [
    'req-text-res-json-content-type-json (responseType json)',
    () => {
      request({
        method: 'GET',
        url: 'res-json-content-type-json'
      }).then(({ body }) => {
        console.log(body)
      })
      axios.get('/api/res-json-content-type-json').then((resp) => {
        console.log('axios', resp.data)
      })
    }
  ],
  [
    'req-text-res-json-content-type-json (responseType text)',
    () => {
      request({
        method: 'GET',
        url: 'res-json-content-type-json',
        responseType: 'text'
      }).then(({ json }) => {
        console.log(json)
      })
      axios
        .get('/api/res-json-content-type-json', { responseType: 'text' })
        .then((resp) => {
          console.log('axios text', resp.data)
        })
    }
  ],
  [
    '404',
    () => {
      request({
        method: 'GET',
        url: 'not-found'
      })
        .then(({ body }) => {
          console.log(body)
        })
        .catch(
          catchError((e) => {
            if (e.lylaError) {
              console.log(e.lylaError)
            } else {
              console.error(e.error)
            }
          })
        )
    }
  ],
  [
    'test',
    () => {
      const _req = request.extend({
        hooks: {
          onBeforeOptionsNormalized: [
            (options) => {
              if (options.url === '/gigigi') {
                options.url = '/post-return-body'
              }
              return options
            }
          ],
          onBeforeRequest: [
            (options) => {
              options.json = { foo: 'bar' }
              return options
            }
          ],
          onAfterResponse: [
            (resp) => {
              debugger
              if (
                '{"foo":"bar"}' === (resp.body as string).replace(/\s\n/g, '')
              ) {
                resp.body = 'jojo'
              }
              return resp
            }
          ]
        }
      })
      _req.post('/gigigi').then(resp => {
        console.log(resp)
      })
    }
  ]
]

handlers.forEach(([selector, handler]) => {
  const button = document.createElement('button')
  button.id = selector
  button.textContent = selector
  button.style.margin = '0 12px 8px 0'
  document.body.appendChild(button)
  button.addEventListener('click', handler)
})
