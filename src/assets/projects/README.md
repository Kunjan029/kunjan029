# Project images

Drop your real artwork in this folder, then add an entry in `src/data/projects.js`
(the template is at the top of that file). Placeholders vanish by themselves once one real project exists.

## Card image (first image, or `cover`)
The Work grid is art-directed, so the same project can appear in different frames depending on its position
(and it changes when a visitor filters): featured 21:9, dominant 3:2, supporting 4:5, closer 21:9
(on phones: 4:5, 4:3, 1:1, 16:10).
Export ONE master image per project at **3:2, 2000 x 1333 px**, with the subject centred and the important
content inside the middle 70%. It survives every frame with only a trim.
Special crop? `focus: 'center top'`, or give a separate `cover` image.
The first project in the visible list is always the large "Featured Project", so put your strongest work first.

## Gallery images (shown in the popup)
Any ratio. The popup shows them whole, never cropped. Long edge 1600 to 2000 px.

## Tips
- WebP or JPG at about 80% quality, under 300 to 400 KB each. PNG only when you need transparency.
- Name files like `project-slug-1.jpg`, `project-slug-2.jpg`.
- Tall infographics or A+ content that must not be cropped on the card: set `fit: 'contain'`.
