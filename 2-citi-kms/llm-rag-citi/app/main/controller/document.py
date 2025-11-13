from flask import request
from ..service.document_service import *
from ..response import HTTPRequestException, HTTPRequestSuccess
    
def insert_document_to_vdb():
    body = request.get_json()
    document_id = body.get('document_id')
    user_id = body.get('user_id')
    tag = body.get('tag')
    collection_name = body.get('collection_name')
    original_filename = body.get('original_filename')
    change = body.get('change', False)
    parser = body.get('parser')
    
    try:
        insert_doc(str(document_id), user_id, tag, collection_name, original_filename, change, parser)
        return HTTPRequestSuccess(message="Document has been added", status_code=201).to_response()
    
    except HTTPRequestException as e:
        print(e.message)
        print(document_id, user_id, tag, collection_name, change)
        return e.to_response()
    

def delete_document_from_vdb():
    args = request.args
    document_id = args.get('document_id')
    collection_name = args.get('collection_name')

    try:
        delete_doc(document_id, collection_name)
        return HTTPRequestSuccess(message="Document has been deleted", status_code=200).to_response()
    
    except HTTPRequestException as e:
        print(e.message)
        return e.to_response()
    
def check_document_exist_in_vdb():
    args = request.args
    document_id = args.get('document_id')
    collection_name = args.get('collection_name')
    user_id = args.get('user_id')
    
    try:
        check_doc(document_id, collection_name, user_id)
        return HTTPRequestSuccess(message="Document exists", status_code=200).to_response()
    
    except HTTPRequestException as e:
        print(e.message)
        return e.to_response()
    
async def create_mind_map():

    body = request.get_json()
    document_id = body.get('document_id')
    user_id = body.get('user_id')
    tag = body.get('tag')
    collection_name = body.get('collection_name')

    # =========== test ==============

    # document_id = "1"
    # user_id = "user_2yfckZL2Y68NPUyEMOMy456sBWD"
    # tag = "docx"
    # collection_name = "private"

    try:
        res = await mind_map(document_id, user_id, tag, collection_name)
        # output_file = "mindmap_output.html"
        # with open(output_file, "w", encoding="utf-8") as f:
        #     f.write(res)

        # print(f"Mind map generated successfully: {output_file}")
        return HTTPRequestSuccess(message="Mind map created", status_code=200, payload=res).to_response()

    except HTTPRequestException as e:
        print(e.message)
        return e.to_response()


async def extract_metadata():
    """
    Extract metadata (title, topics, confidence) from an uploaded document file.
    Expects a multipart/form-data request with a 'file' field.
    """
    import tempfile

    # Check if file is present in request
    if 'file' not in request.files:
        return HTTPRequestException(
            message="No file provided. Please upload a file in the 'file' field.",
            status_code=400
        ).to_response()

    uploaded_file = request.files['file']

    # Check if filename is empty
    if uploaded_file.filename == '':
        return HTTPRequestException(
            message="No file selected",
            status_code=400
        ).to_response()

    # Get file extension
    filename = uploaded_file.filename
    file_extension = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''

    if not file_extension:
        return HTTPRequestException(
            message="File must have an extension",
            status_code=400
        ).to_response()

    # Validate file type (currently only PDF)
    if file_extension != 'pdf':
        return HTTPRequestException(
            message="Currently only PDF files are supported",
            status_code=400
        ).to_response()

    # Create temporary file to store uploaded document
    temp_file = None
    try:
        # Create temporary file with proper extension
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_extension}') as temp_file:
            temp_file_path = temp_file.name
            uploaded_file.save(temp_file_path)

        print(f"File saved to temporary path: {temp_file_path}")

        # Extract metadata using service function
        metadata = await extract_document_metadata(temp_file_path, file_extension)

        return HTTPRequestSuccess(
            message="Metadata extracted successfully",
            status_code=200,
            payload=metadata
        ).to_response()

    except HTTPRequestException as e:
        print(f"HTTP Exception: {e.message}")
        return e.to_response()

    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return HTTPRequestException(
            message=f"An error occurred while processing the file: {str(e)}",
            status_code=500
        ).to_response()

    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                print(f"Temporary file deleted: {temp_file_path}")
            except Exception as e:
                print(f"Failed to delete temporary file: {str(e)}")



    