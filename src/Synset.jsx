import { useState, useRef } from 'react';
import { SynsetRow } from  "./SynsetRow";

/*
function DraggableComponent() {

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e) => {
      if (!isDragging.current) return;

      setPosition({
        x: e.clientX - startX,
        y: e.clientY - startY,
      });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        cursor: 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
    </div>
  );
}
export default DraggableComponent;

*/



export function Synset({nav, extent, onClick}) {
	function handleOnClick(e) {
		nav.goto(parseInt(e.target.id));
		onClick(nav.get());
	}

	var params = {}; var displayList = null;

	[params, displayList] = nav.getDisplayInfo(extent);
//	[params, displayList] = nav.getDispInfo(extent);


  console.log("total chars = " + params.charcount);
	return(
        <ul className="quux" style = {{"font-size" : params.font_size}}>
			{displayList.map(function(displayList, index, array) {
				return (
					<SynsetRow onClick = {handleOnClick}
						   font_size = {params.font_size}
						   row = {displayList}
					/>
				)
			})}
		</ul>
	)
}
