const FONT_SIZE_HACK_MED = 12;
export function SynsetRow({row, font_size, onClick}) {

    function handleOnClick(e) {
	e.preventDefault()
	console.log('SynsetRow Click');
	onClick(e);
    }

    return (
	<>
	    <li className = "quux1">
		{
		    row.map(function(node, index, array) {

			return (<><button
				      id = {row[index].nodeid}
				      title =
				{ (
				   row[index].color == "Black") ?
				   null : ((font_size < FONT_SIZE_HACK_MED ?
				   row[index].text + ' '  : '') +'\n' +
					   row[index].cost.toLocaleString() +
					   '\n' + row[index].syns.toString() +
					   ' links'
				) }

				 onClick = {(row[index].color == "Black") ? null : handleOnClick}
					  style = {{ "color": row[index].color }}
					  className="quuxbutton1">

				      {array[index].text}

				  </button></>) }
			   )
		}
	    </li>
	</>
    )
}



{/*
  return (<button className = "quuxbutton1" onclick= {myFunc(true)} type="button">

return (<button onclick="location.href='http://www.example.com'" type="button">
         www.example.com</button>

	return ( <a href = '#' onClick = {() => return true }
	 style = {{ "color": row[index].color }} >


   return ( <a href={void(0)} onClick={this.onClick} style = {{ "color": row[index].color }}>

	return ( <a href="https://www.foo.com/" style = {{ "color": row[index].color }}>


   return ( <a href = "javascript:void(0);" onclick="myFunc();"
   style = {{ "color": row[index].color }} > */}

{/*
	return ( <a href="javascript:void(0);" onclick="myFunction();" style = {{"color": "blue"}} >  {{"moon"}} </a> ) } ) }
			return ( <a href="foo"> {word[0]} </a> ) } ) }
*/}
