# Riduce il peso dei PNG con una palette fissa: scala nero→carta più le sfumature del rosso (il rosso non si perde).
# Uso: python3 src/quantize.py file.png [...]
import sys
from PIL import Image
BLACK, PAPER, RED = (11, 11, 12), (243, 239, 230), (230, 43, 30)
mix = lambda a, b, t: tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))
cols = [mix((0, 0, 0), (255, 252, 244), i / 175) for i in range(176)]
cols += [mix(RED, BLACK, i / 40) for i in range(40)] + [mix(RED, PAPER, i / 40) for i in range(1, 40)]
pal = Image.new('P', (1, 1)); pal.putpalette([v for c in cols for v in c] + [0] * (768 - len(cols) * 3))
for p in sys.argv[1:]:
    Image.open(p).convert('RGB').quantize(palette=pal, dither=Image.Dither.NONE).save(p, optimize=True)
