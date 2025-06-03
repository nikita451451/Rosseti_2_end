from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        'menu_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('icon', sa.String(), nullable=True),
        sa.Column('path', sa.String(), nullable=True),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'), 
        sa.Column('order', sa.Integer(), server_default='0'),
        sa.ForeignKeyConstraint(['parent_id'], ['menu_items.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
op.add_column('menu_items', sa.Column('is_public', sa.Boolean(), server_default='true'))
def downgrade():
    op.drop_table('menu_items')