os = require 'os'
data = require './data/text'
LanguageDetect = require '../index'

l = new LanguageDetect()

t = os.uptime();
ok = 0

for text in data
    r = l.detect(text.text)
    ok++ if r[0][1] > 0.2

console.log "#{data.length} items processed in #{os.uptime()-t} secs (#{ok} with a score > 0.2)"