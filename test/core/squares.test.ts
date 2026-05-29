import { formatSquare, parseSquare, toCoordinate } from '../../src/index.js';

describe('square notation helpers', () => {
  it('parses and formats algebraic squares', () => {
    expect(parseSquare('e4')).toEqual({ file: 5, rank: 4 });
    expect(parseSquare('aa12')).toEqual({ file: 27, rank: 12 });

    expect(formatSquare({ file: 5, rank: 4 })).toBe('e4');
    expect(formatSquare({ file: 27, rank: 12 })).toBe('aa12');
  });

  it('normalizes coordinates and squares through one helper', () => {
    const coordinate = { file: 2, rank: 7 };

    expect(toCoordinate('b7')).toEqual(coordinate);
    expect(toCoordinate(coordinate)).toBe(coordinate);
  });

  it('rejects invalid square notation', () => {
    expect(() => parseSquare('e0')).toThrow('Invalid square: e0');
    expect(() => parseSquare('4e')).toThrow('Invalid square: 4e');
    expect(() => formatSquare({ file: 0, rank: 1 })).toThrow('Invalid coordinate: 0,1');
  });
});
