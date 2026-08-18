import os
from PIL import Image

img = Image.open('enemies/goblin.png').convert('RGBA')
width, height = img.size
alpha = img.split()[-1]
pixel_data = alpha.load()

# Step 1: Find raw pixel islands (connected components)
visited = [[False for _ in range(height)] for _ in range(width)]
raw_boxes = []

step = 3
for y in range(0, height, step):
    for x in range(0, width, step):
        if not visited[x][y] and pixel_data[x, y] > 15:
            min_x, min_y, max_x, max_y = x, y, x, y
            queue = [(x, y)]
            visited[x][y] = True

            while queue:
                curr_x, curr_y = queue.pop(0)
                min_x = min(min_x, curr_x)
                min_y = min(min_y, curr_y)
                max_x = max(max_x, curr_x)
                max_y = max(max_y, curr_y)

                for dx, dy in [(-step, 0), (step, 0), (0, -step), (0, step)]:
                    nx, ny = curr_x + dx, curr_y + dy
                    if 0 <= nx < width and 0 <= ny < height:
                        if not visited[nx][ny] and pixel_data[nx, ny] > 15:
                            visited[nx][ny] = True
                            queue.append((nx, ny))

            w = max_x - min_x + 1
            h = max_y - min_y + 1

            if w >= 15 and h >= 15:
                raw_boxes.append((min_x, min_y, min(width, max_x + step), min(height, max_y + step)))

print(f"Raw islands found: {len(raw_boxes)}")

# Step 2: Merge boxes that are close to each other (distance threshold = 55px)
def distance_between_boxes(b1, b2):
    x1_min, y1_min, x1_max, y1_max = b1
    x2_min, y2_min, x2_max, y2_max = b2

    dx = max(0, max(x1_min - x2_max, x2_min - x1_max))
    dy = max(0, max(y1_min - y2_max, y2_min - y1_max))
    return max(dx, dy)

dist_threshold = 25

boxes = list(raw_boxes)
merged = True
while merged:
    merged = False
    new_boxes = []
    skip = set()
    for i in range(len(boxes)):
        if i in skip:
            continue
        b1 = boxes[i]
        x1_min, y1_min, x1_max, y1_max = b1
        for j in range(i + 1, len(boxes)):
            if j in skip:
                continue
            b2 = boxes[j]
            x2_min, y2_min, x2_max, y2_max = b2
            if distance_between_boxes(b1, b2) <= dist_threshold:
                new_w = max(x1_max, x2_max) - min(x1_min, x2_min)
                new_h = max(y1_max, y2_max) - min(y1_min, y2_min)
                if new_w <= 360 and new_h <= 360:
                    x1_min = min(x1_min, x2_min)
                    y1_min = min(y1_min, y2_min)
                    x1_max = max(x1_max, x2_max)
                    y1_max = max(y1_max, y2_max)
                    b1 = (x1_min, y1_min, x1_max, y1_max)
                    skip.add(j)
                    merged = True
        new_boxes.append(b1)
    boxes = new_boxes

print(f"Merged boxes (threshold={dist_threshold}px): {len(boxes)}")
for i, b in enumerate(boxes):
    w = b[2] - b[0]
    h = b[3] - b[1]
    print(f" Frame {i+1}: pos=({b[0]}, {b[1]}), size=({w}x{h})")
