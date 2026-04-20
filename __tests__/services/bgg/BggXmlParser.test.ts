import * as fs from 'fs'
import * as path from 'path'
import { BggXmlParser } from '../../../services/bgg/BggXmlParser'

const fixtureDir = path.join(__dirname, '../../fixtures')

const searchXml = fs.readFileSync(path.join(fixtureDir, 'bgg-search.xml'), 'utf-8')
const thingXml = fs.readFileSync(path.join(fixtureDir, 'bgg-thing-batch.xml'), 'utf-8')
const hotXml = fs.readFileSync(path.join(fixtureDir, 'bgg-hot.xml'), 'utf-8')

describe('BggXmlParser.parseSearch', () => {
  it('extracts boardgame items with correct bggId and title', () => {
    const results = BggXmlParser.parseSearch(searchXml)
    expect(results).toHaveLength(2)
    expect(results[0]).toEqual({ bggId: 92415, title: 'Skull' })
    expect(results[1]).toEqual({ bggId: 150145, title: 'Skull King' })
  })

  it('returns [] for malformed XML', () => {
    expect(BggXmlParser.parseSearch('<not>valid<xml')).toEqual([])
  })
})

describe('BggXmlParser.parseThingBatch', () => {
  it('extracts all fields for game 92415 (Skull)', () => {
    const results = BggXmlParser.parseThingBatch(thingXml)
    const skull = results.find(r => r.bggId === 92415)
    expect(skull).toBeDefined()
    expect(skull!.title).toBe('Skull')
    expect(skull!.publisher).toBe('Asmodee')
    expect(skull!.minPlayers).toBe(2)
    expect(skull!.maxPlayers).toBe(6)
    expect(skull!.coverUrl).toBe('https://cf.geekdo-images.com/skull-thumb.jpg')
    expect(skull!.mechanics).toContain('Bluffing')
    expect(skull!.rating).toBeCloseTo(7.23, 1)
    expect(skull!.rank).toBe(348)
  })

  it('extracts correct mechanics for Skull King (trick-taking)', () => {
    const results = BggXmlParser.parseThingBatch(thingXml)
    const skullKing = results.find(r => r.bggId === 150145)
    expect(skullKing).toBeDefined()
    expect(skullKing!.title).toBe('Skull King')
    expect(skullKing!.mechanics).toContain('Trick-taking')
    expect(skullKing!.rank).toBe(512)
  })

  it('returns [] for malformed XML', () => {
    expect(BggXmlParser.parseThingBatch('not xml at all')).toEqual([])
  })

  it('returns primary name when multiple names exist', () => {
    const results = BggXmlParser.parseThingBatch(thingXml)
    const skull = results.find(r => r.bggId === 92415)
    expect(skull!.title).toBe('Skull')
  })
})

describe('BggXmlParser.parseHot', () => {
  it('extracts bggId and title for ranked items', () => {
    const results = BggXmlParser.parseHot(hotXml)
    expect(results).toHaveLength(2)
    expect(results[0]).toEqual({ bggId: 92415, title: 'Skull' })
    expect(results[1]).toEqual({ bggId: 150145, title: 'Skull King' })
  })

  it('returns [] for malformed XML', () => {
    expect(BggXmlParser.parseHot('')).toEqual([])
  })
})
